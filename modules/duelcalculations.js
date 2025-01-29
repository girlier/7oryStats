const calc = require('./calculations')
const key = require('./key')

function whichDivSection(win, division) {
    const RomanNumb = ['I', 'II', 'III', 'IV', 'V']; // all the subdivision symbols
    for (let i = 0; i < RomanNumb.length; i++) { // iterates through the subdivision and div boundaries to see where the wins lie
        if (win >= key.DivBoundaries[division][i + 1] && win < key.DivBoundaries[division][i + 2]) {
            return RomanNumb[i];
        }
    }
    return 'V';
}

function whichDivSectionPercent(win, division) {
    for (let i = 0; i < 4; i++) { // finds the subdivision
        if (win >= key.DivBoundaries[division][i + 1] && win < key.DivBoundaries[division][i + 2]) {
            let per = Math.trunc(((win - key.DivBoundaries[division][i + 1]) /
                (key.DivBoundaries[division][i + 2] - key.DivBoundaries[division][i + 1])) * 100);
            
            for (let j = 0; j < 100; j++) {
                if (per == j) {
                    return key.numbers[j][1]; // uses array to convert a number to a written number
                }
            }
        }
    }
}

exports.getdivision = function(win, divideamount, gm1, gm2, gm3, gm4, gm5, gm6, type) { 
    // gets every type of sub gamemode that can occur
    let GameWins = Math.trunc(countwins(win, gm1, gm2, gm3, gm4, gm5, gm6) / divideamount); // rounds each mode down
    
    if (GameWins < key.DivBoundaries[0][1]) {
        return ['No Div', '', ''];
    }

    for (let i = 0; i < key.DivBoundaries.length; i++) {
        if (GameWins >= key.DivBoundaries[i][1] && GameWins < key.DivBoundaries[i + 1][1]) {
            let divi = [
                whichDivSection(GameWins, i), 
                key.DivBoundaries[i][0],
                key.DivBoundaries[i][6], 
                key.DivBoundaries[i][7], 
                whichDivSectionPercent(GameWins, i)
            ];

            if (type == 0) return divi[0];
            if (type == 1) return divi[3];
            if (type == 4) return divi[1];

            return divi;
        }
    }
}

function countwins(win, gm1, gm2, gm3, gm4, gm5, gm6) {
    let wins = [win, gm1, gm2, gm3, gm4, gm5, gm6];
    let winn = 0;

    for (let i = 0; i < wins.length; i++) {
        if (wins[i] !== undefined) {
            winn += wins[i];
        }
    }

    return winn;
}

exports.addup = function(win, gm1, gm2, gm3, gm4, gm5, gm6) {
    return countwins(win, gm1, gm2, gm3, gm4, gm5, gm6);
}

exports.getrank = function(datalist) {
    // lists all the ranks with rank colors and style choices
    let ranknames = [
        ['§c[OWNER]', '[OWNER]', '#AA0000', 'RED', 'RED', 'RED', 'RED', '[', 'OWNER', '', ']'],
        ['§d[PIG§b+++§d]', '[PIG+++]', '#FF55FF', 'LIGHT_PURPLE', 'LIGHT_PURPLE', 'AQUA', 'LIGHT_PURPLE', '[', 'PIG', '+++', ']', 'AQUA'],
        ['ADMIN', '[ADMIN]', '#AA0000', 'RED', 'RED', 'RED', 'RED', '[', 'ADMIN', '', ']'],
        ['GAME_MASTER', '[GM]', '#00AA00', 'DARK_GREEN', 'DARK_GREEN', 'DARK_GREEN', 'DARK_GREEN', '[', 'GAMEMASTER', '', ']'],
        ['YOUTUBER', '[YOUTUBER]', '#AA0000', 'RED', 'WHITE', 'WHITE', 'RED', '[', 'YOUTUBER', '', ']'],
        ['SUPERSTAR', '[MVP++]', '#FFAA00', 'GOLD', 'GOLD', 'RED', 'GOLD', '[', 'MVP', '++', ']'],
        ['MVP_PLUS', '[MVP+]', '#55FFFF', 'AQUA', 'AQUA', 'RED', 'AQUA', '[', 'MVP', '+', ']'],
        ['MVP', '[MVP]', '#55FFFF', 'AQUA', 'AQUA', 'AQUA', 'AQUA', '[', 'MVP', '', ']'],
        ['VIP_PLUS', '[VIP+]', '#55FF55', 'GREEN', 'GREEN', 'GOLD', 'GREEN', '[', 'VIP', '+', ']'],
        ['VIP', '[VIP]', '#55FF55', 'GREEN', 'GREEN', 'GREEN', 'GREEN', '[', 'VIP', '', ']'],
        ['Non', '', '#55FF55', 'GREY', 'GREY', 'GREY', 'GREY', '', '', '', '']
    ];

    // lists the priority of the ranks
    let ranks = [
        datalist.prefix,
        datalist.rank,
        datalist.monthlyPackageRank,
        datalist.newPackageRank,
        datalist.packageRank
    ];

    let isrank = false;

    for (let l = 0; l < ranknames.length; l++) {
        ranknames[l].push(datalist.rankPlusColor);
    }

    for (let i = 0; i < ranks.length; i++) {
        for (let j = 0; j < ranknames.length; j++) {
            if (ranks[i] == ranknames[j][0]) {
                return ranknames[j];
            }
        }
    }
}
