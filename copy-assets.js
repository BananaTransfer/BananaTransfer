const fs = require('fs');
const path = require('path');

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

// Bootstrap CSS & JS
copyFile(
  'node_modules/bootstrap/dist/css/bootstrap.min.css',
  'public/bootstrap/css/bootstrap.min.css'
);

// Bootstrap JS
copyFile(
  'node_modules/bootstrap/dist/js/bootstrap.bundle.min.js',
  'public/bootstrap/js/bootstrap.bundle.min.js'
);

// Bootstrap Icons CSS
copyFile(
  'node_modules/bootstrap-icons/font/bootstrap-icons.min.css',
  'public/bootstrap/icons/bootstrap-icons.min.css'
);

// Bootstrap Icons font files
['woff', 'woff2'].forEach(ext => {
  copyFile(
    `node_modules/bootstrap-icons/font/fonts/bootstrap-icons.${ext}`,
    `public/bootstrap/icons/fonts/bootstrap-icons.${ext}`
  );
});

// htmx
copyFile(
  'node_modules/htmx.org/dist/htmx.min.js',
  'public/htmx/htmx.min.js'
);

console.log('Assets copied!');