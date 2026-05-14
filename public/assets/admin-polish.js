(() => {
  if (typeof adminLogin !== "function") return;

  adminLogin = function polishedAdminLogin() {
    return `<section class="admin-login-card"><div class="admin-login-mark">CRP</div><h1>Espace administrateur</h1><p>Connectez-vous pour gérer les outils, les avis, les leads et les messages reçus.</p><form class="admin-login"><label>Email administrateur<input name="email" type="email" placeholder="admin@votredomaine.com" autocomplete="username" required></label><label>Mot de passe<input name="password" type="password" placeholder="Votre mot de passe" autocomplete="current-password" required></label><button class="btn" type="submit">Se connecter</button></form><div data-admin-message></div><div class="admin-login-help">L'accès est protégé par vos variables Hostinger ou par un compte enregistré dans la table admins.</div></section>`;
  };
})();
