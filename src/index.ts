import { createExpressServer, useContainer, useExpressServer, Action } from "routing-controllers";
import { useContainer as ormContainer, createConnections } from "typeorm";
import { Container } from "typedi";
import { Models } from "./entities";
import { Controllers } from "./controllers";
import { db } from "../config/db";
import { http } from "../config/http";
import { UserAgentMiddleWare } from "./middlewares/userAgent";
import { AuthorizationChecker, GetCurrentUser } from "./services/AuthServices";
import { ProcessUserClicksSchedule } from "./schedules/ProcessUserClicks";
import { ProcessRequestQueueListener } from "./listeners/ProcessQueueListener";

export const App = async () => {
  useContainer(Container);
  ormContainer(Container);

  let dbConfig: any = db;
  dbConfig.entities = Models
  // console.log(dbConfig)
  var allMiddlewares = [
    UserAgentMiddleWare,
    //TokenMiddleware,
  ];

  try {
    await createConnections([dbConfig]);
  }
  catch(e) {
    console.log(e)
  }

  const app = createExpressServer({
    controllers: Controllers,
    middlewares: allMiddlewares,
    cors: {
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
      allowedHeaders: ["Content-Type", "Authorization", "X-Token", "sentry-trace", "baggage"],
      exposedHeaders: ["X-Total-Length", "Authorization", "Content-Type", "X-Total-Page"],
      credentials: true,
    },
    authorizationChecker: AuthorizationChecker,
    currentUserChecker: GetCurrentUser
  });

  app.listen(http.port, function () {
    console.log("Application Started at: " + http.port);

    //** NOTE: this will reupdate the click base request table.
    // **  every 1 hour and check the clicks for the last 2 hours.  */
    ProcessUserClicksSchedule.start();
    ProcessRequestQueueListener.start();
  });
}
