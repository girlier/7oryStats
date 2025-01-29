const fs = require('fs');

// hypixel api key
exports.key = fs.readFileSync('././.gitignore', 'utf8');

// boundries for each division
exports.DivBoundaries = [
    ["Rookie", 50, 60, 70, 80, 90, 99, 'GREY', ''],
    ["Iron", 100, 130, 160, 180, 220, 249, 'WHITE', ''],
    ["Gold", 250, 300, 350, 400, 450, 499, 'GOLD', ''],
    ["Diamond", 500, 600, 700, 800, 900, 999, 'AQUA', '#00AAAA'],
    ["Master", 1000, 1200, 1400, 1600, 1800, 1999, 'DARK_GREEN', ''],
    ["Legend", 2000, 2600, 3200, 3800, 4400, 4999, 'DARK_RED', '#AA0000'],
    ["Grandmaster", 5000, 6000, 7000, 8000, 9000, 9999, 'YELLOW', '#FFFF55'],
    ["Godlike", 10000, 13000, 16000, 19000, 22000, 24999, 'DARK_PURPLE', '#AA00AA'],
    ["CELESTIAL", 25000, 30000, 35000, 40000, 45000, 49999, 'LIGHT_BLUE', ''],
    ["DIVINE", 50000, 60000, 70000, 80000, 90000, 99999, 'GOLD', ''],
    ["ACCENDED", 100000, 120000, 140000, 160000, 179999, 'RED', ''],
    ["ACCENDED", 180000, 220000, 240000, 260000, 280000, 'RED', ''],
]
const numberToWords = require('number-to-words');

exports.numbers = [];
    for (let i = 0; i <= 100; i++) {
        exports.numbers.push([i, numberToWords.toWords(i)]);
    }
    
// database information
exports.dbuser = "root"
exports.dbpass = "password"
exports.db = "maindatabase"
exports.host = "127.0.0.1"