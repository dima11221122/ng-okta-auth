const { resolve } = require('path');
const { writeFileSync, readFileSync } = require('fs');
const readmeContent = readFileSync(resolve('./README.md'));
writeFileSync(resolve('./dist/okta-auth/README.md'), readmeContent)
// copyFileSync(resolve('./README.md'), resolve('./dist/okta-auth'))
