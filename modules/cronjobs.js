const timestamp = require('unix-timestamp');
const calc = require('./calculations.js');
const api = require('./api.js');
const sql = require('./sql.js');

exports.hour = function () {
    sql.connection.query("SELECT * FROM StatRecords WHERE type='First'", function (err, res, fields) {
        // Gets all the accounts that have been linked
        for (let i = 0; i < res.length; i++) { // Iterates through the linked accounts and makes a wins and losses array for each
            api.GetPlayerData(res[i].UUID)
                .then(playerdata => {
                    let datalist = Object.values(playerdata);
                    let data = datalist[1].stats.Duels;

                    let wins = [
                        data.wins,
                        data.blitz_duel_wins,
                        data.boxing_duel_wins,
                        data.bow_duel_wins,
                        data.bowspleef_duel_wins,
                        (data.bridge_2v2v2v2_wins + data.bridge_3v3v3v3_wins + data.bridge_doubles_wins +
                            data.bridge_duel_wins + data.bridge_four_wins + data.bridge_threes_wins + data.capture_threes_wins),
                        data.classic_duel_wins,
                        data.combo_duel_wins,
                        data.duel_arena_wins,
                        data.mw_duel_wins,
                        data.potion_duel_wins,
                        (data.op_doubles_wins + data.op_duel_wins),
                        (data.sw_duel_wins + data.sw_doubles_wins),
                        data.sumo_duel_wins,
                        (data.uhc_meetup_wins + data.uhc_four_wins + data.uhc_duel_wins + data.uhc_doubles_wins),
                        data.parkour_eight_wins
                    ];

                    let losses = [
                        data.losses,
                        data.blitz_duel_losses,
                        data.boxing_duel_losses,
                        data.bow_duel_losses,
                        data.bowspleef_duel_losses,
                        (data.bridge_2v2v2v2_losses + data.bridge_3v3v3v3_losses +
                            data.bridge_doubles_losses + data.bridge_duel_losses + data.bridge_four_losses + data.bridge_threes_losses +
                            data.capture_threes_losses),
                        data.classic_duel_losses,
                        data.combo_duel_losses,
                        data.duel_arena_losses,
                        data.mw_duel_losses,
                        data.potion_duel_losses,
                        (data.op_doubles_losses + data.op_duel_losses),
                        (data.sw_duel_losses + data.sw_doubles_losses),
                        data.sumo_duel_losses,
                        (data.uhc_meetup_losses + data.uhc_four_losses + data.uhc_duel_losses + data.uhc_doubles_losses),
                        data.parkour_eight_losses
                    ];

                    for (let i = 0; i < wins.length; i++) {
                        if (wins[i] == undefined) {
                            wins[i] = 0;
                        }
                    }

                    for (let i = 0; i < losses.length; i++) {
                        if (losses[i] == undefined) {
                            losses[i] = 0;
                        }
                    }

                    let sqlQuery = `INSERT INTO StatRecords 
                        (Username, UUID, TimeStamp, Type, Wins, Losses, BlitzWins, BlitzLosses, BoxingWins, BoxingLosses, 
                        BowWins, BowLosses, BowSpleefWins, BowSpleefLosses, BridgeWins, BridgeLosses, ClassicWins, 
                        ClassicLosses, ComboWins, ComboLosses, DuelArenaWins, DuelArenaLosses, MegaWallsWins, 
                        MegaWallsLosses, NoDebuffWins, NoDebuffLosses, OpWins, OpLosses, SumoWins, SumoLosses, 
                        SkywarsWins, SkywarsLosses, UHCWins, UHCLosses, ParkourWins, ParkourLosses) 
                        VALUES 
                        ('${res[i].Username}', '${res[i].UUID}', ${timestamp.now()}, 'Hour', '${wins[0]}', '${losses[0]}', 
                        '${wins[1]}', '${losses[1]}', '${wins[2]}', '${losses[2]}', '${wins[3]}', '${losses[3]}', '${wins[4]}',
                        '${losses[4]}', '${wins[5]}', '${losses[5]}', '${wins[6]}', '${losses[6]}', '${wins[7]}', '${losses[7]}', 
                        '${wins[8]}', '${losses[8]}', '${wins[9]}', '${losses[9]}', '${wins[10]}', '${losses[10]}', '${wins[11]}', 
                        '${losses[11]}', '${wins[12]}', '${losses[12]}', '${wins[13]}', '${losses[13]}', '${wins[14]}', 
                        '${losses[14]}', '${wins[15]}', '${losses[15]}')`;

                    console.log(sqlQuery);
                    sql.connection.query(sqlQuery);
                });
        }
    });
};

exports.addPlayer = function (uuid, username) {
    console.log(uuid);
    api.GetPlayerData(uuid)
        .then(playerdata => {
            let datalist = Object.values(playerdata);
            let data = datalist[1].stats.Duels;

            let wins = [
                data.wins,
                data.blitz_duel_wins,
                data.boxing_duel_wins,
                data.bow_duel_wins,
                data.bowspleef_duel_wins,
                (data.bridge_2v2v2v2_wins + data.bridge_3v3v3v3_wins + data.bridge_doubles_wins +
                    data.bridge_duel_wins + data.bridge_four_wins + data.bridge_threes_wins + data.capture_threes_wins),
                data.classic_duel_wins,
                data.combo_duel_wins,
                data.duel_arena_wins,
                data.mw_duel_wins,
                data.potion_duel_wins,
                (data.op_doubles_wins + data.op_duel_wins),
                (data.sw_duel_wins + data.sw_doubles_wins),
                data.sumo_duel_wins,
                (data.uhc_meetup_wins + data.uhc_four_wins + data.uhc_duel_wins + data.uhc_doubles_wins),
                data.parkour_eight_wins
            ];

            let losses = [
                data.losses,
                data.blitz_duel_losses,
                data.boxing_duel_losses,
                data.bow_duel_losses,
                data.bowspleef_duel_losses,
                (data.bridge_2v2v2v2_losses + data.bridge_3v3v3v3_losses +
                    data.bridge_doubles_losses + data.bridge_duel_losses + data.bridge_four_losses + data.bridge_threes_losses +
                    data.capture_threes_losses),
                data.classic_duel_losses,
                data.combo_duel_losses,
                data.duel_arena_losses,
                data.mw_duel_losses,
                data.potion_duel_losses,
                (data.op_doubles_losses + data.op_duel_losses),
                (data.sw_duel_losses + data.sw_doubles_losses),
                data.sumo_duel_losses,
                (data.uhc_four_losses + data.uhc_duel_losses + data.uhc_doubles_losses),
                data.parkour_eight_losses
            ];

            for (let i = 0; i < wins.length; i++) {
                if (wins[i] == undefined) {
                    wins[i] = 0;
                }
            }

            for (let i = 0; i < losses.length; i++) {
                if (losses[i] == undefined) {
                    losses[i] = 0;
                }
            }

            sql.connection.query(`INSERT INTO StatRecords 
                (Username, UUID, TimeStamp, Type, Wins, Losses, BlitzWins, BlitzLosses, BoxingWins, BoxingLosses, BowWins, 
                BowLosses, BowSpleefWins, BowSpleefLosses, BridgeWins, BridgeLosses, ClassicWins, ClassicLosses, ComboWins, 
                ComboLosses, DuelArenaWins, DuelArenaLosses, MegaWallsWins, MegaWallsLosses, NoDebuffWins, NoDebuffLosses, 
                OpWins, OpLosses, SumoWins, SumoLosses, SkywarsWins, SkywarsLosses, UHCWins, UHCLosses, ParkourWins, ParkourLosses) 
                VALUES ('${username}', '${uuid}', ${timestamp.now()}, 'First', '${wins[0]}', '${losses[0]}', '${wins[1]}', 
                '${losses[1]}', '${wins[2]}', '${losses[2]}', '${wins[3]}', '${losses[3]}', '${wins[4]}', '${losses[4]}')`);
        });
};
