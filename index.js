const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const CryptoJS = require('crypto-js');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const PASSPHRASE = "98yNCjeAfWMwk0wI";

function encryptWithCryptoJS(content, passphrase) {
  return CryptoJS.AES.encrypt(content, passphrase).toString();
}

// Helper to safely load file or return fallback string
function loadPayload(filename) {
  const filePath = path.join(__dirname, filename);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '';
}

// Load and pre-encrypt payloads into group structures
const payloadGroups = [
  {
    name: 'group1',
    weight: 70,
    mac: encryptWithCryptoJS(loadPayload('payload-mac-g1.html'), PASSPHRASE),
    win: encryptWithCryptoJS(loadPayload('payload-win-g1.html'), PASSPHRASE)
  },
  {
    name: 'group2',
    weight: 30,
    mac: encryptWithCryptoJS(loadPayload('payload-mac-g2.html'), PASSPHRASE),
    win: encryptWithCryptoJS(loadPayload('payload-win-g2.html'), PASSPHRASE)
  }
];

// Pre-calculate total weight once at startup (O(1) lookup during requests)
const TOTAL_WEIGHT = payloadGroups.reduce((sum, g) => sum + g.weight, 0);

function selectWeightedGroup(groups, totalWeight) {
  let random = Math.random() * totalWeight;
  for (let i = 0; i < groups.length; i++) {
    if (random < groups[i].weight) {
      return groups[i];
    }
    random -= groups[i].weight;
  }
  return groups[0];
}

app.get('/data', (req, res) => {
  const platform = req.query.platform === 'mac' ? 'mac' : 'win';
  const selectedGroup = selectWeightedGroup(payloadGroups, TOTAL_WEIGHT);

  res.json({
    group: selectedGroup.name,
    cipher: selectedGroup[platform]
  });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
