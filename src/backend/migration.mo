import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";

module {
  type OldUserProfile = {
    name : Text;
    phone : Text;
    password : Text;
    walletBalance : Nat;
  };

  type OldGame = {
    id : Text;
    name : Text;
    session : Text;
    openTime : Int;
    closeTime : Int;
  };

  type OldGameResult = {
    gameId : Text;
    openNumber : Text;
    closeNumber : Text;
    jodiNumber : Text;
    panelOpen : Text;
    panelClose : Text;
  };

  type OldBetStatus = {
    #pending;
    #won;
    #lost;
  };

  type OldBet = {
    id : Nat;
    userId : Principal;
    gameId : Text;
    betType : Text;
    betNumber : Text;
    amount : Nat;
    status : OldBetStatus;
  };

  type OldTransaction = {
    userId : Principal;
    txType : Text;
    amount : Int;
    description : Text;
    timestamp : Int;
  };

  type OldWithdrawalStatus = {
    #pending;
    #approved;
    #rejected;
  };

  type OldWithdrawal = {
    id : Nat;
    userId : Principal;
    amount : Nat;
    status : OldWithdrawalStatus;
    method : { #upi : Text; #bank : (Text, Text, Text) };
    details : Text;
    timestamp : Int;
  };

  type OldActor = {
    userProfiles : Map.Map<Principal, OldUserProfile>;
    games : Map.Map<Text, OldGame>;
    gameResults : Map.Map<Text, OldGameResult>;
    bets : Map.Map<Nat, OldBet>;
    withdrawals : Map.Map<Nat, OldWithdrawal>;
    transactions : Map.Map<Principal, [OldTransaction]>;
    betIdCounter : Nat;
    withdrawalIdCounter : Nat;
  };

  type NewUser = {
    name : Text;
    phone : Text;
    passwordHash : Blob;
    walletBalance : Nat;
    createdAt : Int;
    updatedAt : Int;
  };

  type NewGame = {
    id : Text;
    name : Text;
    session : Text;
    openTime : Int;
    closeTime : Int;
  };

  type NewGameResult = {
    gameId : Text;
    openNumber : Text;
    closeNumber : Text;
    jodiNumber : Text;
    panelOpen : Text;
    panelClose : Text;
  };

  type NewBetStatus = {
    #pending;
    #won;
    #lost;
  };

  type NewBet = {
    id : Nat;
    userId : Principal;
    gameId : Text;
    betType : Text;
    betNumber : Text;
    amount : Nat;
    status : NewBetStatus;
    createdAt : Int;
    updatedAt : Int;
  };

  type NewTransaction = {
    userId : Principal;
    txType : Text;
    amount : Int;
    description : Text;
    timestamp : Int;
  };

  type NewWithdrawalStatus = {
    #pending;
    #approved;
    #rejected;
  };

  type NewWithdrawal = {
    id : Nat;
    userId : Principal;
    amount : Nat;
    status : NewWithdrawalStatus;
    method : { #upi : Text; #bank : (Text, Text, Text) };
    details : Text;
    timestamp : Int;
  };

  type NewActor = {
    games : Map.Map<Text, NewGame>;
    gameResults : Map.Map<Text, NewGameResult>;
    bets : Map.Map<Nat, NewBet>;
    withdrawals : Map.Map<Nat, NewWithdrawal>;
    transactions : Map.Map<Principal, [NewTransaction]>;
    betIdCounter : Nat;
    withdrawalIdCounter : Nat;
  };

  public func run(old : OldActor) : NewActor {
    let migratedBets = old.bets.map<Nat, OldBet, NewBet>(
      func(_id, oldBet) {
        {
          oldBet with
          createdAt = 0;
          updatedAt = 0;
        };
      }
    );
    {
      old with
      bets = migratedBets;
    };
  };
};
