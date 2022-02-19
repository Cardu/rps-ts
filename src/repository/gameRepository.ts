import { IDatabase, errors } from "pg-promise";
import { IClient } from "pg-promise/typescript/pg-subset";
import { PlayResponse, RPSError } from "../models";
import { TaskEither, tryCatch } from "fp-ts/lib/TaskEither";
import * as sql from "./sql";

export interface GameRepository {
  getLast: TaskEither<unknown, PlayResponse>;
  insert: (p: PlayResponse) => TaskEither<RPSError, PlayResponse>;
}

const decodeDBError = (error: unknown): RPSError => { 
  if(error instanceof errors.QueryResultError){
    return ({
      type: "QueryDBError",
      message: error.message,
      query: error.query
    })
  }
  return ({type: "UnknowDBError"})
}

export const createGameRepo = (db: IDatabase<{}, IClient>): GameRepository => ({
  getLast: tryCatch(
    () => db.one<PlayResponse>(sql.getLastGame),
    decodeDBError
  ),
  insert: (response: PlayResponse) =>
    tryCatch(
      () => db.none(sql.insertGame, response).then(() => response),
      decodeDBError
    ),
});
