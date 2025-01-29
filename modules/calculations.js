exports.WinLoss = function (win, loss) {
    if (win == undefined) {
        return 0;
    }
    if (loss == undefined) {
        let loss = 0;
        return win;
    }
    if (loss == undefined && win == undefined) { // If a player has not played the game, it will show as undefined, so this will return that as 0
        return 0;
    } else {
        return win / loss;
    }
};

exports.dp = function (value, dp) {
    try {
        // If value is an integer, return it as is
        if (Number.isInteger(value)) {
            return value;
        } 
        // Otherwise, return the value with the specified number of decimal places
        else {
            return Number.parseFloat(value).toFixed(dp);
        }
    } catch (err) {
        return 0;
    }
};

exports.commaNumb = function (value) {
    try {
        // Converts the provided value to a string with commas separating thousands
        return value.toLocaleString();
    } catch (err) {
        return 0;
    }
};

exports.hashCode = function (str) { // Basic hashing algorithm
    let hash = 0, i, chr;
    if (str.length === 0) return hash;
    for (i = 0; i < str.length; i++) {
        chr = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return Math.abs(hash);
};
