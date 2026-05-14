const express = require("express");
const bcrypt = require("bcryptjs");
const { getPool, allTools, featuredTools, getTool, getCategories, getArticles, getArticle, insert, dashboardStats, adminList, setReviewStatus, deleteRow, upsertTool } = require("../lib/db");
const { scoreTools } = require("../lib/scoring");
const { signAdmin, requireAdmin } = require("../middleware/auth");

const router = express.Router();

router.get("/health", (req, res) => res.json({ ok: true, name: "CRP Advisor", time: new Date().toISOString() }));
router.get("/categories", asyncHandler(async (req, res) => res.json(await getCategories())));
router.get("/tools", asyncHandler(async (req, res) => res.json(await allTools({ category: req.query.category, search: req.query.search }))));
router.get("/tools/featured", asyncHandler(async (req, res) => res.json(await featuredTools())));
router.get("/tools/:slug", asyncHandler(async (req, res) => {
  const tool = await getTool(req.params.slug);
  if (!tool) return res.status(404).json({ error: "Outil introuvable" });
  res.json(tool);
}));
router.post("/recommendations", asyncHandler(async (req, res) => res.json({ results: scoreTools(await allTools(), req.body || {}).slice(0, 3) })));
router.post("/leads", asyncHandler(async (req, res) => res.status(201).json(await insert("leads", { first_name: clean(req.body.first_name), email: clean(req.body.email), answers: JSON.stringify(req.body.answers || {}), results: JSON.stringify(req.body.results || []) }))));
router.post("/newsletter", asyncHandler(async (req, res) => res.status(201).json(await insert("newsletter_subscribers", { first_name: clean(req.body.first_name), email: clean(req.body.email) }))));
router.post("/contact", asyncHandler(async (req, res) => res.status(201).json(await insert("contact_messages", { name: clean(req.body.name), email: clean(req.body.email), subject: clean(req.body.subject), message: clean(req.body.message) }))));
router.post("/suggest-tool", asyncHandler(async (req, res) => res.status(201).json(await insert("tool_suggestions", { tool_name: clean(req.body.tool_name), website: clean(req.body.website), category: clean(req.body.category), submitter_name: clean(req.body.submitter_name), submitter_email: clean(req.body.submitter_email), message: clean(req.body.message) }))));
router.post("/reviews", asyncHandler(async (req, res) => {
  const rating = Math.max(1, Math.min(5, Number(req.body.rating || 5)));
  const row = await insert("reviews", { tool_slug: clean(req.body.tool_slug), first_name: clean(req.body.first_name), email: clean(req.body.email), rating, content: clean(req.body.content) });
  res.status(201).json({ ...row, message: "Avis reçu. Il sera publié après validation." });
}));
router.get("/reviews/:slug", asyncHandler(async (req, res) => {
  const rows = await adminList("reviews");
  res.json(rows.filter((review) => review.tool_slug === req.params.slug && Number(review.approved) === 1));
}));
router.get("/articles", asyncHandler(async (req, res) => res.json(await getArticles())));
router.get("/articles/:slug", asyncHandler(async (req, res) => {
  const article = await getArticle(req.params.slug);
  if (!article) return res.status(404).json({ error: "Article introuvable" });
  res.json(article);
}));
router.post("/analytics/view", asyncHandler(async (req, res) => {
  await insert("page_views", { path: clean(req.body.path || req.path), tool_slug: clean(req.body.tool_slug), source: clean(req.body.source), device_type: clean(req.body.device_type) });
  res.status(204).end();
}));

router.post("/admin/login", asyncHandler(async (req, res) => {
  const email = clean(req.body.email);
  const password = String(req.body.password || "");
  const db = getPool();
  const envEmail = process.env.ADMIN_EMAIL;
  const envPassword = process.env.ADMIN_PASSWORD;

  if (envEmail && envPassword && email === envEmail && password === envPassword) {
    res.cookie("admin_token", signAdmin({ id: 1, email }), cookieOptions());
    return res.json({ email });
  }

  if (!db) return res.status(503).json({ error: "Accès admin non configuré" });

  const [rows] = await db.execute("SELECT * FROM admins WHERE email = :email LIMIT 1", { email });
  const admin = rows[0];
  if (!admin || !(await bcrypt.compare(password, admin.password_hash))) return res.status(401).json({ error: "Identifiants invalides" });
  res.cookie("admin_token", signAdmin(admin), cookieOptions());
  res.json({ email: admin.email });
}));
router.post("/admin/logout", (req, res) => { res.clearCookie("admin_token", cookieOptions()); res.status(204).end(); });
router.get("/admin/stats", requireAdmin, asyncHandler(async (req, res) => res.json(await dashboardStats())));
router.get("/admin/:table", requireAdmin, asyncHandler(async (req, res) => {
  const allowed = ["tools", "reviews", "newsletter_subscribers", "leads", "contact_messages", "tool_suggestions", "articles", "promo_codes"];
  if (!allowed.includes(req.params.table)) return res.status(404).json({ error: "Table inconnue" });
  res.json(await adminList(req.params.table));
}));
router.post("/admin/tools", requireAdmin, asyncHandler(async (req, res) => res.status(201).json(await upsertTool(req.body))));
router.patch("/admin/reviews/:id", requireAdmin, asyncHandler(async (req, res) => res.json(await setReviewStatus(req.params.id, Boolean(req.body.approved)))));
router.delete("/admin/reviews/:id", requireAdmin, asyncHandler(async (req, res) => res.json(await deleteRow("reviews", req.params.id))));

function clean(value) { return String(value || "").trim(); }
function cookieOptions() { return { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 12 * 60 * 60 * 1000 }; }
function asyncHandler(fn) { return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next); }

module.exports = router;
