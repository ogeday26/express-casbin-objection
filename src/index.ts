import express from 'express';
import Knex  from 'knex';
import { Model } from 'objection';
import { newEnforcer } from 'casbin';
import { authz } from 'casbin-express-authz';
import { ObjectionAdapter } from '@willsoto/casbin-objection-adapter';
import path from 'path';

(async () => {
  const knex = Knex({
    client: 'pg',
    connection: {
      host : 'localhost',
      user : 'postgres',
      password : 'postgres',
      database : 'postgres'
    }
  });
  
  Model.knex(knex);

  const app = express();
  const adapter = await ObjectionAdapter.newAdapter(knex, {});
  const enforcer = newEnforcer(path.join(__dirname, './authz_model.conf'), adapter);

  (await enforcer).enableAutoSave(true);

  (await enforcer).addPolicies([
    ["alice", "/data1", "GET"],
    ["bob", "/data2", "POST"],
  ]);
  
  app.use((req, res, next) => {
    res.locals.username = 'alice';
    console.log(res.locals);
    
    next();
  });
  
  app.use(authz({ newEnforcer: enforcer }));

  app.get("/data1", (req, res) => {
    res.status(200).json("access");
  });
  
  app.listen(3000, () => {
    console.log("Server is starting...");
  });
})();
