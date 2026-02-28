import Map "mo:core/Map";
import Array "mo:core/Array";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Initialize the user system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // TYPES
  type UserProfile = {
    name : Text;
    phone : Text;
    password : Text;
    walletBalance : Nat;
  };

  type Game = {
    id : Text;
    name : Text;
    session : Text;
    openTime : Int;
    closeTime : Int;
  };

  type GameResult = {
    gameId : Text;
    openNumber : Text;
    closeNumber : Text;
    jodiNumber : Text;
    panelOpen : Text;
    panelClose : Text;
  };

  type Bet = {
    id : Nat;
    userId : Principal;
    gameId : Text;
    betType : Text;
    betNumber : Text;
    amount : Nat;
    status : BetStatus;
  };

  type BetStatus = {
    #pending;
    #won;
    #lost;
  };

  type Transaction = {
    userId : Principal;
    txType : Text;
    amount : Int;
    description : Text;
    timestamp : Int;
  };

  type Withdrawal = {
    id : Nat;
    userId : Principal;
    amount : Nat;
    status : WithdrawalStatus;
    method : { #upi : Text; #bank : (Text, Text, Text) };
    details : Text;
    timestamp : Int;
  };

  type WithdrawalStatus = {
    #pending;
    #approved;
    #rejected;
  };

  module Transaction {
    public func compare(transaction1 : Transaction, transaction2 : Transaction) : Order.Order {
      Int.compare(transaction2.timestamp, transaction1.timestamp);
    };
  };

  // STATE
  let userProfiles = Map.empty<Principal, UserProfile>();
  let games = Map.empty<Text, Game>();
  let gameResults = Map.empty<Text, GameResult>();
  let bets = Map.empty<Nat, Bet>();
  let withdrawals = Map.empty<Nat, Withdrawal>();
  let transactions = Map.empty<Principal, [Transaction]>();

  var betIdCounter : Nat = 0;
  var withdrawalIdCounter : Nat = 0;

  // HELPER FUNCTIONS
  private func recordTransaction(userId : Principal, txType : Text, amount : Int, description : Text) {
    let tx : Transaction = {
      userId;
      txType;
      amount;
      description;
      timestamp = Time.now();
    };

    let userTxs = switch (transactions.get(userId)) {
      case (null) { [] };
      case (?txs) { txs };
    };

    let updatedTxs = [tx].concat(userTxs);
    transactions.add(userId, updatedTxs);
  };

  private func updateWalletBalance(userId : Principal, newBalance : Nat) {
    switch (userProfiles.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?profile) {
        let updatedProfile : UserProfile = {
          name = profile.name;
          phone = profile.phone;
          password = profile.password;
          walletBalance = newBalance;
        };
        userProfiles.add(userId, updatedProfile);
      };
    };
  };

  // USER PROFILE METHODS
  public shared ({ caller }) func register(name : Text, phone : Text, password : Text) : async () {
    if (userProfiles.containsKey(caller)) {
      Runtime.trap("User already registered");
    };

    let profile : UserProfile = {
      name;
      phone;
      password;
      walletBalance = 100_000_000; // Rs.1000 = 1000 * 100000 (assuming 100000 = Re.1)
    };

    userProfiles.add(caller, profile);
    
    // Assign user role
    AccessControl.assignRole(accessControlState, caller, caller, #user);
    
    // Record signup bonus transaction
    recordTransaction(caller, "credit", 100_000_000, "Signup bonus");
  };

  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get user profiles");
    };
    userProfiles.get(caller);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save user profiles");
    };
    userProfiles.add(caller, profile);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public query ({ caller }) func getWalletBalance() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get their wallet balance");
    };
    let profile = switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?p) { p };
    };
    profile.walletBalance;
  };

  public shared ({ caller }) func addMoney(amount : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add money");
    };

    let profile = switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?p) { p };
    };

    let newBalance = profile.walletBalance + amount;
    updateWalletBalance(caller, newBalance);
    recordTransaction(caller, "credit", Int.fromNat(amount), "Money added to wallet");
  };

  public query ({ caller }) func getAllUsers() : async [Principal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    userProfiles.keys().toArray();
  };

  // GAMES METHODS
  public shared ({ caller }) func addGame(game : Game) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add games");
    };

    games.add(game.id, game);
  };

  public query ({ caller }) func getGames() : async [Game] {
    games.values().toArray();
  };

  public query ({ caller }) func getGame(id : Text) : async ?Game {
    games.get(id);
  };

  // GAME RESULTS
  public shared ({ caller }) func addGameResult(result : GameResult) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add game results");
    };
    gameResults.add(result.gameId, result);
  };

  public shared ({ caller }) func updateGameResult(gameId : Text, updatedResult : GameResult) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update game results");
    };

    switch (gameResults.get(gameId)) {
      case (null) { Runtime.trap("Result not found") };
      case (?_) { gameResults.add(gameId, updatedResult) };
    };
  };

  public query ({ caller }) func getGameResult(id : Text) : async ?GameResult {
    gameResults.get(id);
  };

  // BETS METHODS
  public shared ({ caller }) func placeBet(game : Text, betType : Text, betNumber : Text, amount : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place bets");
    };

    if (amount < 1_000_000) {
      Runtime.trap("Minimum bet amount is Rs.10");
    };

    let profile = switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?p) { p };
    };

    if (profile.walletBalance < amount) {
      Runtime.trap("Insufficient wallet balance");
    };

    betIdCounter += 1;

    let bet : Bet = {
      id = betIdCounter;
      userId = caller;
      gameId = game;
      betType;
      betNumber;
      amount;
      status = #pending;
    };

    bets.add(betIdCounter, bet);

    // Deduct from wallet
    let newBalance = profile.walletBalance - amount;
    updateWalletBalance(caller, newBalance);
    recordTransaction(caller, "debit", -Int.fromNat(amount), "Bet placed on game " # game);
  };

  public query ({ caller }) func getBets() : async [Bet] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view bets");
    };

    let allBets = bets.values().toArray();
    
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return allBets;
    };

    // Filter to user's own bets
    allBets.filter(func(bet : Bet) : Bool { bet.userId == caller });
  };

  public query ({ caller }) func getBet(id : Nat) : async ?Bet {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view bets");
    };

    switch (bets.get(id)) {
      case (null) { null };
      case (?bet) {
        if (bet.userId != caller and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own bets");
        };
        ?bet;
      };
    };
  };

  public shared ({ caller }) func settleBets(gameId : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can settle bets");
    };

    let result = switch (gameResults.get(gameId)) {
      case (null) { Runtime.trap("Game result not found") };
      case (?r) { r };
    };

    let allBets = bets.values().toArray();
    let gameBets = allBets.filter(func(bet : Bet) : Bool { bet.gameId == gameId and bet.status == #pending });

    for (bet in gameBets.vals()) {
      var isWinner = false;
      var multiplier : Nat = 0;

      switch (bet.betType) {
        case ("open") {
          if (bet.betNumber == result.openNumber) {
            isWinner := true;
            multiplier := 9;
          };
        };
        case ("close") {
          if (bet.betNumber == result.closeNumber) {
            isWinner := true;
            multiplier := 9;
          };
        };
        case ("jodi") {
          if (bet.betNumber == result.jodiNumber) {
            isWinner := true;
            multiplier := 90;
          };
        };
        case ("panel") {
          if (bet.betNumber == result.panelOpen or bet.betNumber == result.panelClose) {
            isWinner := true;
            multiplier := 150;
          };
        };
        case (_) {};
      };

      let updatedBet : Bet = {
        id = bet.id;
        userId = bet.userId;
        gameId = bet.gameId;
        betType = bet.betType;
        betNumber = bet.betNumber;
        amount = bet.amount;
        status = if (isWinner) { #won } else { #lost };
      };

      bets.add(bet.id, updatedBet);

      if (isWinner) {
        let winnings = bet.amount * multiplier;
        let userProfile = switch (userProfiles.get(bet.userId)) {
          case (null) { Runtime.trap("User not found") };
          case (?p) { p };
        };

        let newBalance = userProfile.walletBalance + winnings;
        updateWalletBalance(bet.userId, newBalance);
        recordTransaction(bet.userId, "credit", Int.fromNat(winnings), "Bet won on game " # gameId);
      };
    };
  };

  // TRANSACTIONS METHODS
  public query ({ caller }) func getUserTransactions() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view transactions");
    };

    let userTxs = switch (transactions.get(caller)) {
      case (null) { [] };
      case (?txs) { txs };
    };
    
    let sorted = userTxs.sort();
    sorted;
  };

  public query ({ caller }) func getAllTransactions() : async [Transaction] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all transactions");
    };

    let txArraysIter = transactions.values();
    let allTxArrays = txArraysIter.toArray();
    
    if (allTxArrays.size() == 0) {
      return [];
    };
    
    var combined : [Transaction] = [];
    for (txArray in allTxArrays.vals()) {
      combined := combined.concat(txArray);
    };
    
    let sorted = combined.sort();
    sorted;
  };

  // WITHDRAWALS
  public shared ({ caller }) func requestWithdrawal(amount : Nat, method : { #upi : Text; #bank : (Text, Text, Text) }, details : Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can request withdrawals");
    };

    if (amount < 100) {
      Runtime.trap("Minimum withdrawal amount is Rs.100");
    };

    let profile = switch (userProfiles.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?p) { p };
    };

    if (profile.walletBalance < amount) {
      Runtime.trap("Insufficient wallet balance");
    };

    withdrawalIdCounter += 1;

    let withdrawal : Withdrawal = {
      id = withdrawalIdCounter;
      userId = caller;
      amount;
      status = #pending;
      method;
      details;
      timestamp = Time.now();
    };

    withdrawals.add(withdrawalIdCounter, withdrawal);

    // Deduct from wallet immediately
    let newBalance = profile.walletBalance - amount;
    updateWalletBalance(caller, newBalance);
    recordTransaction(caller, "withdrawal", -Int.fromNat(amount), "Withdrawal request #" # withdrawalIdCounter.toText());

    withdrawalIdCounter;
  };

  public query ({ caller }) func getWithdrawals() : async [Withdrawal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view withdrawals");
    };

    let allWithdrawals = withdrawals.values().toArray();
    
    if (AccessControl.isAdmin(accessControlState, caller)) {
      return allWithdrawals;
    };

    // Filter to user's own withdrawals
    allWithdrawals.filter(func(w : Withdrawal) : Bool { w.userId == caller });
  };

  public shared ({ caller }) func approveWithdrawal(withdrawalId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can approve withdrawals");
    };

    let withdrawal = switch (withdrawals.get(withdrawalId)) {
      case (null) { Runtime.trap("Withdrawal not found") };
      case (?w) { w };
    };

    if (withdrawal.status != #pending) {
      Runtime.trap("Withdrawal already processed");
    };

    let updatedWithdrawal : Withdrawal = {
      id = withdrawal.id;
      userId = withdrawal.userId;
      amount = withdrawal.amount;
      status = #approved;
      method = withdrawal.method;
      details = withdrawal.details;
      timestamp = withdrawal.timestamp;
    };

    withdrawals.add(withdrawalId, updatedWithdrawal);
    recordTransaction(withdrawal.userId, "withdrawal", -Int.fromNat(withdrawal.amount), "Withdrawal approved #" # withdrawalId.toText());
  };

  public shared ({ caller }) func rejectWithdrawal(withdrawalId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reject withdrawals");
    };

    let withdrawal = switch (withdrawals.get(withdrawalId)) {
      case (null) { Runtime.trap("Withdrawal not found") };
      case (?w) { w };
    };

    if (withdrawal.status != #pending) {
      Runtime.trap("Withdrawal already processed");
    };

    let updatedWithdrawal : Withdrawal = {
      id = withdrawal.id;
      userId = withdrawal.userId;
      amount = withdrawal.amount;
      status = #rejected;
      method = withdrawal.method;
      details = withdrawal.details;
      timestamp = withdrawal.timestamp;
    };

    withdrawals.add(withdrawalId, updatedWithdrawal);

    // Refund to wallet
    let userProfile = switch (userProfiles.get(withdrawal.userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?p) { p };
    };

    let newBalance = userProfile.walletBalance + withdrawal.amount;
    updateWalletBalance(withdrawal.userId, newBalance);
    recordTransaction(withdrawal.userId, "credit", Int.fromNat(withdrawal.amount), "Withdrawal rejected, refunded #" # withdrawalId.toText());
  };
};
