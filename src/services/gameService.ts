import { Move, RPSError, Result, PlayResponse } from "../models";
import { GameRepository } from "../repository";
import { pipe } from "fp-ts/lib/function";
import * as T from "fp-ts/lib/Task";
import * as TE from "fp-ts/lib/TaskEither";

export interface GameService {
  play: (move: Move) => TE.TaskEither<RPSError, Result>;
  lastPlay: () => TE.TaskEither<unknown, PlayResponse>;
}

const randomMove = (): Move => {
  const random = Math.floor(Math.random() * 3) + 1;
  switch (random) {
    case 1:
      return "Rock";
    case 2:
      return "Paper";
    default:
      return "Scissor";
  }
};

const internalPlay = (userMove: Move, computerMove: Move): T.Task<Result>  => {
  if (userMove === computerMove) return T.of("Draw");
    switch (userMove) {
      case "Paper":
        return T.of(computerMove === "Rock" ? "Win" : "Lose");
      case "Rock":
        return T.of(computerMove === "Scissor" ? "Win" : "Lose");
      case "Scissor":
        return T.of(computerMove === "Paper" ? "Win" : "Lose");
    }
}

export const createGameServiceImperative = (repo: GameRepository) => ({
  play: (userMove: Move): Promise<Result> => {
    const computerMove = randomMove()
    const resultPromise: Promise<Result> = internalPlay(userMove, computerMove)() // side effect!! here the promise start running
    return resultPromise
      .then(result => {
        const response: PlayResponse = {userMove, computerMove, result}
        return repo
          .insert(response)()
          .then(response => {
              if(response._tag == 'Left') {
                throw response.left
              }
              else {
                return response.right.result
              }
          })

      })        
  },
  lastPlay: () => repo.getLast,
});

const internalPlayMapped = (userMove: Move, computerMove: Move): T.Task<PlayResponse> => 
  T.map((result: Result) => ({userMove, computerMove, result}))(internalPlay(userMove, computerMove))
  //internalPlay(userMove, computerMove).map((result) => ...) most common, but the other one is giving you code suggestion when used inside a pipe

export const createGameService = (repo: GameRepository): GameService => ({ 
  play: (userMove: Move): TE.TaskEither<RPSError, Result> => pipe(
      randomMove(),
      computerMove => internalPlayMapped(userMove, computerMove),      
      T.chain(repo.insert), // can chain task and taskEither because taskEither is a subtype of task
      TE.map(r => r.result) // mapping of taskeither applies ONLY if the inner result is right, you can map only the error with .mapLeft or both results with .bimap
    ),
  lastPlay: () => repo.getLast,
});

//don't use an intermediate map, but to me it's harder to understand, it's miming Haskell do syntax (or Scala's flatMap)
export const createGameServiceBind = (repo: GameRepository): GameService => ({
  play: (userMove: Move): TE.TaskEither<RPSError, Result> => pipe(
      T.Do,
      T.bind('computerMove', () => T.of(randomMove())),
      T.bind('result', ({computerMove}) => internalPlay(userMove, computerMove)),
      T.map(({computerMove, result}) => ({userMove, computerMove, result})),
      T.chain(repo.insert),
      TE.map(r => r.result)
    ),
  lastPlay: () => repo.getLast,
});
