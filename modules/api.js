const apikey = require('./key')
var fetch = require("node-fetch");
async function getApiJson(url) {
    let response = await fetch(url); // Wait for the fetch request to complete and get the response object
    let data = await response.json() // Wait for the JSON data to be extracted from the response object
    return data; // Return the JSON data
    }

exports.FindUUID = async function(username) {
    try {
    // gets the json of the mojang api data
        let playerUUIDApiData = await
        getApiJson(`https://api.mojang.com/users/profiles/minecraft/${username}`)
        let ApiDataArray = (Object.values(playerUUIDApiData))
        // returns the uuid linked to the username from the api request
        return ApiDataArray[0]
    } catch(err) {
    console.log("player not found" + err)
    }
}

exports.GetPlayerData = async function(uuid) {
    // gets the json of the hypixel api from a player (defined from the parameter)
    let playerdata = await getApiJson(`https://api.hypixel.net/player?key=${apikey.key}&uuid=${uuid}`)
    let ApiDataArray = (Object.values(playerdata))
    return ApiDataArray;
}