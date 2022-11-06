const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

const app = express();

let db = null;

app.use(express.json());

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB Error : ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//converting player Object to response Object.
const convertPlayerObjToResponseObj = (obj) => {
  return {
    playerId: obj.player_id,
    playerName: obj.player_name,
  };
};

//Convert match details object to response object.
const convertMatchObjToResponseObj = (obj) => {
  return {
    matchId: obj.match_id,
    match: obj.match,
    year: obj.year,
  };
};

//API 1
//Return a list of all the player table
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `SELECT * FROM player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => convertPlayerObjToResponseObj(eachPlayer))
  );
});

//API 2
//Returns a specific player based on the player Id
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const getPlayerDetails = await db.get(getPlayerQuery);
  response.send(convertPlayerObjToResponseObj(getPlayerDetails));
});

//API 3
//Updates the details of a specific player based on the player ID
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerNameQuery = `UPDATE player_details 
  SET player_name = '${playerName}' WHERE player_id = ${playerId};`;
  await db.run(updatePlayerNameQuery);
  response.send("Player Details Updated");
});

//API 4
//Returns the match details of a specific match
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchDetailsQuery = `SELECT * FROM match_details WHERE match_id = ${matchId};`;
  const matchDetails = await db.get(getMatchDetailsQuery);
  response.send(convertMatchObjToResponseObj(matchDetails));
});

//API 5
//Returns a list of all the matches of a player
app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `SELECT match_id, match, year FROM player_match_score NATURAL JOIN match_details WHERE player_id = ${playerId};`;
  const playerMatchDetails = await db.all(getPlayerMatchesQuery);
  response.send(
    playerMatchDetails.map((match) => convertMatchObjToResponseObj(match))
  );
});

//API 6
//Returns a list of players of a specific match
app.get("/matches/:matchId/players/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchesOfPlayerQuery = `SELECT player_id, player_name FROM player_match_score NATURAL JOIN player_details WHERE match_id = ${matchId};`;
  const matchesOfPlayerDetails = await db.all(getMatchesOfPlayerQuery);
  response.send(
    matchesOfPlayerDetails.map((player) =>
      convertPlayerObjToResponseObj(player)
    )
  );
});

//API 7
//Returns the statistics of the total score, fours, sixes, of a specific player based on the player ID
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatsOfPlayerQuery = `SELECT player_id AS playerId, player_name AS playerName, SUM(score) AS totalScore, SUM(fours) AS totalFours, SUM(sixes) AS totalSixes FROM player_match_score NATURAL JOIN player_details WHERE player_id = ${playerId};`;
  const statsOfPlayer = await db.get(getStatsOfPlayerQuery);
  response.send(statsOfPlayer);
});

module.exports = app;
