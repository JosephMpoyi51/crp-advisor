require('dotenv').config();
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const app = express();
const PORT = Number(process.env.PORT || 3000);
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

const categories = [
  ['redaction','Redaction','Textes, articles, copywriting et assistants generalistes'],
  ['image','Image','Generation, edition et creation visuelle'],
  ['code','Code','Developpement, debug et productivite logicielle'],
  ['recherche','Recherche','Veille, sources et informations a jour'],
  ['productivite','Productivite','Organisation, notes, reunions et operations'],
  ['marketing','Marketing','SEO, publicite, CRM et contenu commercial'],
  ['audio','Audio','Voix, transcription, podcast et narration'],
  ['video','Video','Generation et edition video IA'],
  ['automatisation','Automatisation','Workflows, agents et integrations'],
  ['design','Design','UI, presentations, marque et assets visuels']
].map(([slug,name,description])=>({slug,name,description}));

const tools = [
  ['chatgpt','ChatGPT','redaction','Assistant IA polyvalent pour rediger, analyser, coder, resumer et generer des idees.','Gratuit',0,1,1,['debutant','intermediaire','avance'],92,4.7,1],
  ['claude','Claude','redaction','Assistant d Anthropic reconnu pour les textes nuances et analyse de longs documents.','Gratuit',0,1,1,['intermediaire','avance'],90,4.6,1],
  ['mistral','Mistral AI','redaction','Solution europeenne performante en francais avec API et options open source.','Gratuit',0,1,1,['intermediaire','avance'],85,4.4,0],
  ['gemini','Gemini','recherche','Assistant multimodal de Google pour rechercher, analyser et travailler avec Workspace.','Gratuit',0,1,1,['debutant','intermediaire'],82,4.3,0],
  ['perplexity','Perplexity AI','recherche','Moteur de recherche IA avec sources citees, ideal pour la veille et le fact-checking.','Gratuit',0,1,1,['debutant','intermediaire','avance'],88,4.5,1],
  ['github-copilot','GitHub Copilot','code','Assistant de programmation integre aux IDE pour completer, expliquer et generer du code.','Gratuit limite',0,0,0,['intermediaire','avance'],91,4.5,1],
  ['midjourney','Midjourney','image','Generateur d images IA reconnu pour des visuels artistiques de tres haute qualite.','10 $/mois',10,0,0,['intermediaire','avance'],93,4.6,1],
  ['notion-ai','Notion AI','productivite','Assistant integre a Notion pour rediger, resumer, traduire et organiser les informations.','10 $/mois',10,0,1,['debutant','intermediaire'],78,4.7,0],
  ['elevenlabs','ElevenLabs','audio','Plateforme de synthese vocale et de clonage de voix pour produire des audios naturels.','Gratuit',0,1,1,['debutant','intermediaire','avance'],91,4.7,1],
  ['runway','Runway','video','Suite creative IA pour generer, modifier et ameliorer des videos.','Gratuit',0,1,0,['intermediaire','avance'],87,4.3,0]
].map(([slug,name,category,description,price_label,monthly_price,api_available,french_support,levels,editorial_score,g2_rating,is_featured])=>({slug,name,category,description,price_label,monthly_price,api_available:Boolean(api_available),french_support:Boolean(french_support),levels,editorial_score,g2_rating,is_featured:Boolean(is_featured),use_cases:['Usage professionnel','Gain de temps','Creation assistee'],advantages:['Interface moderne','Bon rapport valeur','Solution reconnue'],limits:['Verifier les donnees sensibles','Comparer selon votre contexte'],ideal_profile:'Professionnels, createurs, freelances et PME.',alternatives:[]}));

let pool;
function dbEnabled(){return process.env.DB_HOST&&process.env.DB_USER&&process.env.DB_NAME}
function getPool(){if(!dbEnabled())return null;if(!pool){pool=mysql.createPool({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD||'',database:process.env.DB_NAME,waitForConnections:true,connectionLimit:10,namedPlaceholders:true})}return pool}
async function query(sql,params={}){const db=getPool();if(!db)return null;const [rows]=await db.execute(sql,params);return rows}
async function initDb(){const db=getPool();if(!db)return;await db.query(`CREATE TABLE IF NOT EXISTS leads(id INT AUTO_INCREMENT PRIMARY KEY,first_name VARCHAR(120),email VARCHAR(220) NOT NULL,answers JSON,results JSON,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);await db.query(`CREATE TABLE IF NOT EXISTS newsletter_subscribers(id INT AUTO_INCREMENT PRIMARY KEY,first_name VARCHAR(120),email VARCHAR(220) NOT NULL UNIQUE,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);await db.query(`CREATE TABLE IF NOT EXISTS contact_messages(id INT AUTO_INCREMENT PRIMARY KEY,name VARCHAR(180) NOT NULL,email VARCHAR(220) NOT NULL,subject VARCHAR(220),message TEXT NOT NULL,handled TINYINT(1) DEFAULT 0,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);await db.query(`CREATE TABLE IF NOT EXISTS tool_suggestions(id INT AUTO_INCREMENT PRIMARY KEY,tool_name VARCHAR(220) NOT NULL,website TEXT,category VARCHAR(120),submitter_name VARCHAR(180),submitter_email VARCHAR(220),message TEXT,status VARCHAR(40) DEFAULT 'new',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`)}

app.set('trust proxy',1);app.use(helmet({contentSecurityPolicy:false}));app.use(cors({origin:true,credentials:true}));app.use(express.json({limit:'1mb'}));app.use(express.urlencoded({extended:true}));app.use(cookieParser());app.use(rateLimit({windowMs:60000,max:240}));app.use(express.static(path.join(__dirname,'public')));

app.get('/api/health',(req,res)=>res.json({ok:true,name:'CRP Advisor',time:new Date().toISOString()}));
app.get('/api/categories',(req,res)=>res.json(categories));
app.get('/api/tools',(req,res)=>{let list=[...tools];if(req.query.category)list=list.filter(t=>t.category===req.query.category);if(req.query.search){const q=String(req.query.search).toLowerCase();list=list.filter(t=>(t.name+' '+t.description).toLowerCase().includes(q))}res.json(list)});
app.get('/api/tools/featured',(req,res)=>res.json([...tools].sort((a,b)=>b.editorial_score-a.editorial_score).slice(0,6)));
app.get('/api/tools/:slug',(req,res)=>{const tool=tools.find(t=>t.slug===req.params.slug);if(!tool)return res.status(404).json({error:'Outil introuvable'});res.json(tool)});
app.post('/api/recommendations',(req,res)=>res.json({results:scoreTools(tools,req.body||{}).slice(0,3)}));
app.post('/api/newsletter',async(req,res,next)=>{try{const db=getPool();if(db)await query('INSERT IGNORE INTO newsletter_subscribers(first_name,email) VALUES(:first_name,:email)',{first_name:req.body.first_name||'',email:req.body.email||''});res.status(201).json({ok:true})}catch(e){next(e)}});
app.post('/api/leads',async(req,res,next)=>{try{const results=scoreTools(tools,req.body.answers||{}).slice(0,3);const db=getPool();if(db)await query('INSERT INTO leads(first_name,email,answers,results) VALUES(:first_name,:email,:answers,:results)',{first_name:req.body.first_name||'',email:req.body.email||'',answers:JSON.stringify(req.body.answers||{}),results:JSON.stringify(results)});res.status(201).json({ok:true,results})}catch(e){next(e)}});
app.post('/api/contact',async(req,res,next)=>{try{const db=getPool();if(db)await query('INSERT INTO contact_messages(name,email,subject,message) VALUES(:name,:email,:subject,:message)',{name:req.body.name||'',email:req.body.email||'',subject:req.body.subject||'',message:req.body.message||''});res.status(201).json({ok:true})}catch(e){next(e)}});
app.post('/api/suggest-tool',async(req,res,next)=>{try{const db=getPool();if(db)await query('INSERT INTO tool_suggestions(tool_name,website,category,submitter_name,submitter_email,message) VALUES(:tool_name,:website,:category,:submitter_name,:submitter_email,:message)',{tool_name:req.body.tool_name||'',website:req.body.website||'',category:req.body.category||'',submitter_name:req.body.submitter_name||'',submitter_email:req.body.submitter_email||'',message:req.body.message||''});res.status(201).json({ok:true})}catch(e){next(e)}});
app.get('/api/articles',(req,res)=>res.json([{slug:'comment-choisir-un-outil-ia',title:'Comment choisir un outil IA',excerpt:'Une methode simple pour eviter de perdre du temps.',content:'Commencez par votre besoin reel, puis regardez budget, niveau, integrations et confidentialite.'}]));
app.post('/api/admin/login',(req,res)=>{if(req.body.email===(process.env.ADMIN_EMAIL||'admin@crp.local')&&req.body.password===(process.env.ADMIN_PASSWORD||'admin123')){const token=jwt.sign({email:req.body.email,role:'admin'},JWT_SECRET,{expiresIn:'12h'});res.cookie('admin_token',token,{httpOnly:true,sameSite:'lax',secure:process.env.NODE_ENV==='production',maxAge:43200000});return res.json({ok:true})}res.status(401).json({error:'Identifiants invalides'})});
function auth(req,res,next){try{jwt.verify(req.cookies.admin_token||'',JWT_SECRET);next()}catch{res.status(401).json({error:'Authentification requise'})}}
app.get('/api/admin/stats',auth,(req,res)=>res.json({tools:tools.length,categories:categories.length,leads:0,newsletter:0,reviews:0,messages:0}));
app.get('/api/admin/tools',auth,(req,res)=>res.json(tools));

function scoreTools(list,answers){const w={besoin:34,budget:20,niveau:14,priorite:12,api:10,francais:10};const lim={gratuit:0,petit:15,moyen:40,eleve:Infinity};return list.map(t=>{const besoin=answers.besoin?(t.category===answers.besoin?w.besoin:w.besoin*.12):w.besoin*.5;const price=Number(t.monthly_price||0);let budget=w.budget*.5;if(answers.budget){const l=lim[answers.budget]??Infinity;if(price<=0)budget=w.budget;else if(answers.budget==='gratuit')budget=0;else budget=price<=l?w.budget:Math.round(w.budget*Math.min(l/price,1))}const niveau=answers.niveau?(t.levels.includes(answers.niveau)?w.niveau:0):w.niveau*.5;const priorite=answers.priorite==='simplicite'?(t.levels.includes('debutant')?w.priorite:w.priorite*.35):answers.priorite==='integration'?(t.api_available?w.priorite:w.priorite*.25):answers.priorite==='confidentialite'?(t.french_support&&price<=40?w.priorite:w.priorite*.45):Math.round(w.priorite*Math.min(t.editorial_score/92,1));const api=answers.apiRequise?(t.api_available?w.api:0):w.api;const francais=answers.francaisRequis?(t.french_support?w.francais:0):w.francais;return{...t,score_total:besoin+budget+niveau+priorite+api+francais}}).sort((a,b)=>b.score_total-a.score_total)}

app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'public/index.html')));
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({error:'Erreur serveur'})});
initDb().finally(()=>app.listen(PORT,()=>console.log(`CRP Advisor running on port ${PORT}`)));
