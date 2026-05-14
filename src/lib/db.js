const mysql = require("mysql2/promise");
const { categories, tools, articles } = require("./seed-data");

let pool;
const memory = { tools: [...tools], categories: [...categories], articles: [...articles], leads: [], newsletter_subscribers: [], contact_messages: [], tool_suggestions: [], reviews: [], page_views: [], promo_codes: [] };

function dbEnabled() {
  return Boolean(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);
}

function getPool() {
  if (!dbEnabled()) return null;
  if (!pool) {
    pool = mysql.createPool({ host: process.env.DB_HOST, port: Number(process.env.DB_PORT || 3306), user: process.env.DB_USER, password: process.env.DB_PASSWORD || "", database: process.env.DB_NAME, waitForConnections: true, connectionLimit: 10, namedPlaceholders: true });
  }
  return pool;
}

async function initSchema() {
  const db = getPool();
  if (!db) return;
  await db.query("CREATE TABLE IF NOT EXISTS categories(id INT AUTO_INCREMENT PRIMARY KEY, slug VARCHAR(120) NOT NULL UNIQUE, name VARCHAR(180) NOT NULL, description TEXT, sort_order INT DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
  await db.query("CREATE TABLE IF NOT EXISTS tools(id INT AUTO_INCREMENT PRIMARY KEY, slug VARCHAR(160) NOT NULL UNIQUE, name VARCHAR(220) NOT NULL, category VARCHAR(120) NOT NULL, description TEXT NOT NULL, price_label VARCHAR(160) DEFAULT '', monthly_price DECIMAL(10,2) DEFAULT 0, api_available TINYINT(1) DEFAULT 0, french_support TINYINT(1) DEFAULT 0, levels JSON, editorial_score INT DEFAULT 0, g2_rating DECIMAL(3,2) DEFAULT 0, is_featured TINYINT(1) DEFAULT 0, affiliate_url TEXT, use_cases JSON, advantages JSON, limits JSON, ideal_profile TEXT, alternatives JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
  await db.query("CREATE TABLE IF NOT EXISTS admins(id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(220) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
  await db.query("CREATE TABLE IF NOT EXISTS leads(id INT AUTO_INCREMENT PRIMARY KEY, first_name VARCHAR(120), email VARCHAR(220) NOT NULL, answers JSON, results JSON, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
  await db.query("CREATE TABLE IF NOT EXISTS newsletter_subscribers(id INT AUTO_INCREMENT PRIMARY KEY, first_name VARCHAR(120), email VARCHAR(220), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
  await db.query("CREATE TABLE IF NOT EXISTS contact_messages(id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(180), email VARCHAR(220), subject VARCHAR(220), message TEXT, handled TINYINT(1) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
  await db.query("CREATE TABLE IF NOT EXISTS tool_suggestions(id INT AUTO_INCREMENT PRIMARY KEY, tool_name VARCHAR(220), website TEXT, category VARCHAR(120), submitter_name VARCHAR(180), submitter_email VARCHAR(220), message TEXT, status VARCHAR(40) DEFAULT 'new', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
  await db.query("CREATE TABLE IF NOT EXISTS reviews(id INT AUTO_INCREMENT PRIMARY KEY, tool_slug VARCHAR(160), first_name VARCHAR(120), email VARCHAR(220), rating INT DEFAULT 5, content TEXT, approved TINYINT(1) DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
  await db.query("CREATE TABLE IF NOT EXISTS page_views(id INT AUTO_INCREMENT PRIMARY KEY, path VARCHAR(255), tool_slug VARCHAR(160), source VARCHAR(255), device_type VARCHAR(40), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)");
  await seedDefaults(db);
}

async function seedDefaults(db) {
  const [categoryRows] = await db.execute("SELECT COUNT(*) AS total FROM categories");
  if (!categoryRows[0].total) {
    for (const category of categories) await db.execute("INSERT INTO categories(slug, name, description) VALUES(:slug, :name, :description)", category);
  }
  const [toolRows] = await db.execute("SELECT COUNT(*) AS total FROM tools");
  if (!toolRows[0].total) {
    for (const item of tools) {
      await db.execute("INSERT INTO tools(slug, name, category, description, price_label, monthly_price, api_available, french_support, levels, editorial_score, g2_rating, is_featured, affiliate_url, use_cases, advantages, limits, ideal_profile, alternatives) VALUES(:slug, :name, :category, :description, :price_label, :monthly_price, :api_available, :french_support, :levels, :editorial_score, :g2_rating, :is_featured, :affiliate_url, :use_cases, :advantages, :limits, :ideal_profile, :alternatives)", serializeTool(item));
    }
  }
}

async function allTools(filters = {}) {
  const db = getPool();
  if (!db) return filterTools(memory.tools, filters);
  const [rows] = await db.execute("SELECT * FROM tools ORDER BY editorial_score DESC");
  return filterTools(rows.map(normalizeTool), filters);
}
async function featuredTools() { return (await allTools()).filter((tool) => tool.is_featured).slice(0, 6); }
async function getTool(slug) { return (await allTools()).find((tool) => tool.slug === slug) || null; }
async function getCategories() {
  const db = getPool();
  if (!db) return memory.categories;
  const [rows] = await db.execute("SELECT slug, name, description FROM categories ORDER BY sort_order ASC, name ASC");
  return rows.length ? rows : memory.categories;
}
async function getArticles() { return memory.articles; }
async function getArticle(slug) { return memory.articles.find((article) => article.slug === slug) || null; }

async function insert(table, row) {
  const db = getPool();
  if (!db) {
    const saved = { id: memory[table]?.length + 1 || 1, ...row, created_at: new Date().toISOString() };
    if (!memory[table]) memory[table] = [];
    memory[table].push(saved);
    return saved;
  }
  const keys = Object.keys(row);
  const columns = keys.join(", ");
  const placeholders = keys.map((key) => `:${key}`).join(", ");
  const [result] = await db.execute(`INSERT INTO ${table}(${columns}) VALUES(${placeholders})`, row);
  return { id: result.insertId, ...row };
}

async function dashboardStats() {
  const db = getPool();
  if (!db) return { tools: memory.tools.length, leads: memory.leads.length, reviews: memory.reviews.length, messages: memory.contact_messages.length, suggestions: memory.tool_suggestions.length, newsletter: memory.newsletter_subscribers.length, views: memory.page_views.length };
  const tables = ["tools", "leads", "reviews", "contact_messages", "tool_suggestions", "newsletter_subscribers", "page_views"];
  const output = {};
  for (const table of tables) {
    const [rows] = await db.execute(`SELECT COUNT(*) AS total FROM ${table}`);
    output[table === "contact_messages" ? "messages" : table.replace("newsletter_subscribers", "newsletter").replace("page_views", "views").replace("tool_suggestions", "suggestions")] = rows[0].total;
  }
  return output;
}

async function adminList(table) {
  const db = getPool();
  if (!db) return memory[table] || [];
  const [rows] = await db.execute(`SELECT * FROM ${table} ORDER BY id DESC LIMIT 200`);
  return rows;
}

async function upsertTool(row) {
  const saved = normalizeTool(row);
  const db = getPool();
  if (!db) {
    const index = memory.tools.findIndex((tool) => tool.slug === saved.slug);
    if (index >= 0) memory.tools[index] = { ...memory.tools[index], ...saved };
    else memory.tools.unshift(saved);
    return saved;
  }
  await db.execute("INSERT INTO tools(slug, name, category, description, price_label, monthly_price, api_available, french_support, levels, editorial_score, g2_rating, is_featured, affiliate_url, use_cases, advantages, limits, ideal_profile, alternatives) VALUES(:slug, :name, :category, :description, :price_label, :monthly_price, :api_available, :french_support, :levels, :editorial_score, :g2_rating, :is_featured, :affiliate_url, :use_cases, :advantages, :limits, :ideal_profile, :alternatives) ON DUPLICATE KEY UPDATE name=VALUES(name), category=VALUES(category), description=VALUES(description), price_label=VALUES(price_label), monthly_price=VALUES(monthly_price), api_available=VALUES(api_available), french_support=VALUES(french_support), levels=VALUES(levels), editorial_score=VALUES(editorial_score), is_featured=VALUES(is_featured)", serializeTool(saved));
  return saved;
}

function filterTools(list, filters = {}) {
  const search = String(filters.search || "").toLowerCase();
  return list.filter((tool) => (!filters.category || tool.category === filters.category) && (!search || `${tool.name} ${tool.description}`.toLowerCase().includes(search)));
}
function serializeTool(tool) {
  const normalized = normalizeTool(tool);
  return { ...normalized, api_available: normalized.api_available ? 1 : 0, french_support: normalized.french_support ? 1 : 0, is_featured: normalized.is_featured ? 1 : 0, levels: JSON.stringify(normalized.levels), use_cases: JSON.stringify(normalized.use_cases), advantages: JSON.stringify(normalized.advantages), limits: JSON.stringify(normalized.limits), alternatives: JSON.stringify(normalized.alternatives) };
}
function normalizeTool(tool) {
  return { ...tool, api_available: Boolean(Number(tool.api_available) || tool.api_available === true), french_support: Boolean(Number(tool.french_support) || tool.french_support === true), is_featured: Boolean(Number(tool.is_featured) || tool.is_featured === true), levels: Array.isArray(tool.levels) ? tool.levels : safeJson(tool.levels, []), use_cases: Array.isArray(tool.use_cases) ? tool.use_cases : safeJson(tool.use_cases, []), advantages: Array.isArray(tool.advantages) ? tool.advantages : safeJson(tool.advantages, []), limits: Array.isArray(tool.limits) ? tool.limits : safeJson(tool.limits, []), alternatives: Array.isArray(tool.alternatives) ? tool.alternatives : safeJson(tool.alternatives, []) };
}
function safeJson(value, fallback) { try { return typeof value === "string" ? JSON.parse(value) : fallback; } catch { return fallback; } }

module.exports = { getPool, initSchema, allTools, featuredTools, getTool, getCategories, getArticles, getArticle, insert, dashboardStats, adminList, upsertTool };
