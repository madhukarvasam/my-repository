const express = require("express");
const { open } = require("sqlite");
const path = require("path");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const databasePath = path.join(__dirname, "covid19India.db");
let database = null;
const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server running at http://localhost:3000/");
    });
  } catch (error) {
    console.log(`Database Error: ${error}`);
    process.exit(1);
  }
};
initializeDbAndServer();

const convertStateDbObject = (objectItem) => {
  return {
    stateId: objectItem.state_id,
    stateName: objectItem.state_name,
    population: objectItem.population,
  };
};
app.all("/states/", async (request, response) => {
  const gatStatesQuery = `
        SELECT *
        FROM state;`;
  const getStates = await database.all(gatStatesQuery);
  response.send(getStates.map((eachState) => convertStateDbObject(eachState)));
});
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateDetailsQuery = `
        SELECT *
        FROM state
        WHERE state_id=${state_id};`;
  const getStateDetails = await database.get(getStateDetailsQuery);
  response.send(convertStateDbObject(getStateDetails));
});
app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const createDistrictQuery = `insert into district(district_name,state_id,cases,cured,active,deaths)
        values('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const createDistrict = await database.run(createDistrictQuery);
  response.send(`DistrictSuccessfully Added`);
});
const convertDbObjectDistrict = (objectItem) => {
  return {
    districtId: objectItem.district_id,
    districtName: objectItem.district_name,
    stateId: objectItem.state_id,
    cases: objectItem.cases,
    cured: objectItem.cured,
    active: objectItem.active,
    deaths: objectItem.deaths,
  };
};
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictByIdQuery = `
        SELECT *
        FROM district
        WHERE district_id=${districtId};`;
  const getDistrictByIdQueryResponse = await database.get(getDistrictByIdQuery);
  response.send(convertDbObjectDistrict(getDistrictByIdQueryResponse));
});
app.delete("/districts/:districtId/", async (request, resolve) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
        DELETE FROM district 
        WHERE district_id=${districtId};`;
  const deleteDistrict = await database.run(deleteDistrictQuery);
  response.send("District Removed");
});
app.put("/districts/:districtId", async (request, resolve) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `update district set
        district_name='${districtName}',
        state_id=${stateId},
        cases=${cases},
        cured=${cured},
        active=${active},
        deaths=${deaths}
        where district_id=${districtId};`;
  const updateDistrictQueryResponse = await database.run(updateDistrictQuery);
  response.send("District Details Updated");
});
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateByIDStatsQuery = `
        select sum(cases) as totalCases,sum(cured) as totalCured,
        sum(active) as totalActive sum(deaths) as totalDeaths
        from district
        where state_id=${stateId};`;
  const getStateByIDStatusQueryResponse = await database.get(
    getStateByIDStatsQuery
  );
  response.send(getStateByIDStatusQueryResponse);
});
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
        select state_id from district
        where district_id=${districtId};`;
  const getDistrictIdQueryResponse = await database.get(getDistrictIdQuery);
  const getStateNameQuery = `
        select state_name as stateName from state
        where district_id=${getDistrictIdQueryResponse.state_id};`;
  const getStateNameQueryResponse = await database.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
