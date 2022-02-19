type NeverPlayed = {
  type: "NeverPlayed";
};

type QueryDBError = {
  type: "QueryDBError";
  message: string;
  query: string;
};

type UnknowDBError = {
  type: "UnknowDBError";  
};

//named RPS to avoid ambiguity with the Error default type in ES5
export type RPSError = NeverPlayed | QueryDBError | UnknowDBError;
