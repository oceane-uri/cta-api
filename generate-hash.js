const bcrypt = require('bcrypt');

const password = 'direCtion@3076';

bcrypt.hash(password, 10).then(hash => {
    console.log('Hash du mot de passe:', hash);
});

// INSERT INTO users(id, name, email, password, role, created_at, updated_at)
// VALUES(UUID(), 'Super Admin', 'superadmin@cnsr.bj', '$2b$10$Fw48g2NPG4itiYpyEXwAeO6KpwSrOQ8Vnml2pR0BFflS3qiiILg3m', 'superadmin', NOW(), NOW());otDePasseSuperSecret

// node generate-hash.js

// UPDATE users
// SET password = 'NOUVEAU_HASH'
// WHERE username = 'nom_utilisateur';

// INSERT INTO users(id, name, email, password, role, created_at, updated_at)
// VALUES(UUID(), 'Super Admin', 'superadmin@cnsr.bj', '$2b$10$Fw48g2NPG4itiYpyEXwAeO6KpwSrOQ8Vnml2pR0BFflS3qiiILg3m', 'superadmin', NOW(), NOW());otDePasseSuperSecret

//email = superadmin@cnsr.bj
// Password= 'Direction@2025';

//email = direction@cnsr.bj
// Password= 'direCtion@3076';