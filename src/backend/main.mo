import Map "mo:core/Map";
import Array "mo:core/Array";
import Time "mo:core/Time";
import Nat "mo:core/Nat";
import Int "mo:core/Int";
import Text "mo:core/Text";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import Migration "migration"; // Explicit migration function

(with migration = Migration.run)
actor {
  // Initialize the user system state
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // TYPES
  public type UserProfile = {
    name : Text;
    phone : Text;
    walletBalance : Nat;
    createdAt : Int;
    updatedAt : Int;
  };

  type User = {
    name : Text;
    phone : Text;
    passwordHash : Blob;
    walletBalance : Nat;
    createdAt : Int;
    updatedAt : Int;
  };

  type SessionData = {
    userId : Principal;
    expiry : Int;
    createdAt : Int;
    lastUsed : Int;
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
    createdAt : Int;
    updatedAt : Int;
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
  let users = Map.empty<Principal, User>();
  let sessions = Map.empty<Text, SessionData>();
  let games = Map.empty<Text, Game>();
  let gameResults = Map.empty<Text, GameResult>();
  let bets = Map.empty<Nat, Bet>();
  let withdrawals = Map.empty<Nat, Withdrawal>();
  let transactions = Map.empty<Principal, [Transaction]>();

  var betIdCounter : Nat = 0;
  var withdrawalIdCounter : Nat = 0;

  // UTILS
  func now() : Int {
    Time.now();
  };

  // WARNING: This is not safe and only used for local testing
  func hashPassword(password : Text) : Blob {
    password.encodeUtf8();
  };

  // Verify that the caller owns the session token
  func verifySessionOwnership(caller : Principal, token : Text) : SessionData {
    let session = switch (sessions.get(token)) {
      case (null) { Runtime.trap("Session not found") };
      case (?s) { s };
    };

    if (session.expiry < now()) {
      Runtime.trap("Session expired");
    };

    if (session.userId != caller) {
      Runtime.trap("Unauthorized: Session does not belong to caller");
    };

    session;
  };

  // AUTHENTICATION
  public shared ({ caller }) func register(name : Text, phone : Text, password : Text) : async Text {
    // Check if phone already exists
    let existingUsers = users.toArray().filter(
      func((id, user)) : Bool {
        user.phone == phone;
      }
    );

    if (existingUsers.size() > 0) {
      Runtime.trap("Phone number already registered");
    };

    let isFirstUser = users.isEmpty();

    let user : User = {
      name;
      phone;
      passwordHash = hashPassword(password);
      walletBalance = 100_000_000;
      createdAt = now();
      updatedAt = now();
    };

    users.add(caller, user);

    // First user becomes admin, others are regular users
    if (isFirstUser) {
      AccessControl.assignRole(accessControlState, caller, caller, #admin);
    } else {
      AccessControl.assignRole(accessControlState, caller, caller, #user);
    };

    // Record signup bonus transaction
    recordTransaction(caller, "credit", 100_000_000, "Signup bonus");

    let token = createSession(caller);
    token;
  };

  public shared ({ caller }) func login(phone : Text, password : Text) : async Text {
    let userId = findUserByPhone(phone);
    let user : User = switch (users.get(userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?u) { u };
    };

    if (user.passwordHash != hashPassword(password)) {
      Runtime.trap("Invalid password");
    };

    let token = createSession(userId);
    token;
  };

  func findUserByPhone(phone : Text) : Principal {
    let matches = users.toArray().filter(
      func((id, user)) : Bool {
        user.phone == phone;
      }
    );
    if (matches.size() == 0) {
      Runtime.trap("User not found");
    };
    matches[0].0;
  };

  func createSession(userId : Principal) : Text {
    let token = userId.toText() # Time.now().toText();
    let sessionData : SessionData = {
      userId;
      expiry = now() + 86_400_000_000_000;
      createdAt = now();
      lastUsed = now();
    };
    sessions.add(token, sessionData);
    token;
  };

  func getUserBySession(token : Text) : User {
    let session = switch (sessions.get(token)) {
      case (null) { Runtime.trap("Session not found") };
      case (?s) { s };
    };

    if (session.expiry < now()) {
      Runtime.trap("Session expired");
    };

    let user = switch (users.get(session.userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?u) { u };
    };

    user;
  };

  // USER PROFILE FUNCTIONS (Required by instructions)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };

    switch (users.get(caller)) {
      case (null) { null };
      case (?user) {
        ?{
          name = user.name;
          phone = user.phone;
          walletBalance = user.walletBalance;
          createdAt = user.createdAt;
          updatedAt = user.updatedAt;
        };
      };
    };
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };

    switch (users.get(user)) {
      case (null) { null };
      case (?u) {
        ?{
          name = u.name;
          phone = u.phone;
          walletBalance = u.walletBalance;
          createdAt = u.createdAt;
          updatedAt = u.updatedAt;
        };
      };
    };
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };

    let existingUser = switch (users.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?u) { u };
    };

    let updatedUser : User = {
      name = profile.name;
      phone = existingUser.phone;
      passwordHash = existingUser.passwordHash;
      walletBalance = existingUser.walletBalance;
      createdAt = existingUser.createdAt;
      updatedAt = now();
    };

    users.add(caller, updatedUser);
  };

  // ADMIN CHECK FUNCTION (Required by user request)
  public query ({ caller }) func isAdminCheck(token : Text) : async Bool {
    let session = switch (sessions.get(token)) {
      case (null) { return false };
      case (?s) { s };
    };

    if (session.expiry < now()) {
      return false;
    };

    AccessControl.isAdmin(accessControlState, session.userId);
  };

  // GAMES
  public shared ({ caller }) func addGame(game : Game) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can add games");
    };

    games.add(game.id, game);
  };

  public shared ({ caller }) func updateGame(game : Game) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update games");
    };

    games.add(game.id, game);
  };

  public shared ({ caller }) func deleteGame(id : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete games");
    };

    games.remove(id);
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

  public query ({ caller }) func getGameResult(gameId : Text) : async ?GameResult {
    gameResults.get(gameId);
  };

  // WALLET FUNCTIONS
  public shared ({ caller }) func addMoney(token : Text, amount : Nat) : async () {
    // Verify caller owns the session
    let session = verifySessionOwnership(caller, token);

    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can add money");
    };

    let user = switch (users.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?u) { u };
    };

    let newBalance = user.walletBalance + amount;
    let updatedUser : User = {
      name = user.name;
      phone = user.phone;
      passwordHash = user.passwordHash;
      walletBalance = newBalance;
      createdAt = user.createdAt;
      updatedAt = now();
    };
    users.add(caller, updatedUser);

    recordTransaction(caller, "credit", Int.fromNat(amount), "Money added to wallet");
  };

  public query ({ caller }) func getWalletBalance(token : Text) : async Nat {
    // Verify caller owns the session
    let session = switch (sessions.get(token)) {
      case (null) { Runtime.trap("Session not found") };
      case (?s) { s };
    };

    if (session.expiry < now()) {
      Runtime.trap("Session expired");
    };

    if (session.userId != caller) {
      Runtime.trap("Unauthorized: Session does not belong to caller");
    };

    let user = switch (users.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?u) { u };
    };

    user.walletBalance;
  };

  // BETS FUNCTIONS
  public shared ({ caller }) func placeBet(token : Text, gameId : Text, betType : Text, betNumber : Text, amount : Nat) : async () {
    // Verify caller owns the session
    let session = verifySessionOwnership(caller, token);

    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can place bets");
    };

    let user = switch (users.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?u) { u };
    };

    if (amount < 1_000_000) {
      Runtime.trap("Minimum bet amount is Rs.10");
    };

    if (user.walletBalance < amount) {
      Runtime.trap("Insufficient wallet balance");
    };

    betIdCounter += 1;

    let bet : Bet = {
      id = betIdCounter;
      userId = caller;
      gameId;
      betType;
      betNumber;
      amount;
      status = #pending;
      createdAt = now();
      updatedAt = now();
    };

    bets.add(betIdCounter, bet);

    // Deduct from balance
    let newBalance = user.walletBalance - amount;
    let updatedUser : User = {
      name = user.name;
      phone = user.phone;
      passwordHash = user.passwordHash;
      walletBalance = newBalance;
      createdAt = user.createdAt;
      updatedAt = now();
    };
    users.add(caller, updatedUser);

    recordTransaction(caller, "debit", -Int.fromNat(amount), "Bet placed on game " # gameId);
  };

  public query ({ caller }) func getBets(token : Text) : async [Bet] {
    // Verify caller owns the session
    let session = switch (sessions.get(token)) {
      case (null) { Runtime.trap("Session not found") };
      case (?s) { s };
    };

    if (session.expiry < now()) {
      Runtime.trap("Session expired");
    };

    if (session.userId != caller) {
      Runtime.trap("Unauthorized: Session does not belong to caller");
    };

    let allBets = bets.values().toArray();
    allBets.filter(func(bet : Bet) : Bool { bet.userId == caller });
  };

  public query ({ caller }) func getAllBets() : async [Bet] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all bets");
    };

    bets.values().toArray();
  };

  // ADMIN BET SETTLEMENT
  public shared ({ caller }) func settleBet(betId : Nat, won : Bool) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can settle bets");
    };

    let bet = switch (bets.get(betId)) {
      case (null) { Runtime.trap("Bet not found") };
      case (?b) { b };
    };

    if (bet.status != #pending) {
      Runtime.trap("Bet already settled");
    };

    let updatedBet : Bet = {
      id = bet.id;
      userId = bet.userId;
      gameId = bet.gameId;
      betType = bet.betType;
      betNumber = bet.betNumber;
      amount = bet.amount;
      status = if (won) { #won } else { #lost };
      createdAt = bet.createdAt;
      updatedAt = now();
    };

    bets.add(betId, updatedBet);

    if (won) {
      let multiplier = switch (bet.betType) {
        case ("open") { 9 };
        case ("close") { 9 };
        case ("jodi") { 90 };
        case ("panel") { 150 };
        case (_) { 0 };
      };

      let winAmount = bet.amount * multiplier;

      let user = switch (users.get(bet.userId)) {
        case (null) { Runtime.trap("User not found") };
        case (?u) { u };
      };

      let newBalance = user.walletBalance + winAmount;
      let updatedUser : User = {
        name = user.name;
        phone = user.phone;
        passwordHash = user.passwordHash;
        walletBalance = newBalance;
        createdAt = user.createdAt;
        updatedAt = now();
      };
      users.add(bet.userId, updatedUser);

      recordTransaction(bet.userId, "credit", Int.fromNat(winAmount), "Bet won - Game " # bet.gameId);
    };
  };

  // WITHDRAWAL FUNCTIONS
  public shared ({ caller }) func requestWithdrawal(token : Text, amount : Nat, method : { #upi : Text; #bank : (Text, Text, Text) }, details : Text) : async Nat {
    // Verify caller owns the session
    let session = verifySessionOwnership(caller, token);

    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can request withdrawals");
    };

    if (amount < 10_000_000) {
      Runtime.trap("Minimum withdrawal amount is Rs.100");
    };

    let user = switch (users.get(caller)) {
      case (null) { Runtime.trap("User not found") };
      case (?u) { u };
    };

    if (user.walletBalance < amount) {
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
      timestamp = now();
    };

    withdrawals.add(withdrawalIdCounter, withdrawal);

    // Deduct from balance
    let newBalance = user.walletBalance - amount;
    let updatedUser : User = {
      name = user.name;
      phone = user.phone;
      passwordHash = user.passwordHash;
      walletBalance = newBalance;
      createdAt = user.createdAt;
      updatedAt = now();
    };
    users.add(caller, updatedUser);

    recordTransaction(caller, "debit", -Int.fromNat(amount), "Withdrawal requested");

    withdrawalIdCounter;
  };

  public query ({ caller }) func getWithdrawals(token : Text) : async [Withdrawal] {
    // Verify caller owns the session
    let session = switch (sessions.get(token)) {
      case (null) { Runtime.trap("Session not found") };
      case (?s) { s };
    };

    if (session.expiry < now()) {
      Runtime.trap("Session expired");
    };

    if (session.userId != caller) {
      Runtime.trap("Unauthorized: Session does not belong to caller");
    };

    let allWithdrawals = withdrawals.values().toArray();
    allWithdrawals.filter(func(w : Withdrawal) : Bool { w.userId == caller });
  };

  public query ({ caller }) func getAllWithdrawals() : async [Withdrawal] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all withdrawals");
    };

    withdrawals.values().toArray();
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

    recordTransaction(withdrawal.userId, "withdrawal", -Int.fromNat(withdrawal.amount), "Withdrawal approved");
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

    // Refund to user
    let user = switch (users.get(withdrawal.userId)) {
      case (null) { Runtime.trap("User not found") };
      case (?u) { u };
    };

    let newBalance = user.walletBalance + withdrawal.amount;
    let updatedUser : User = {
      name = user.name;
      phone = user.phone;
      passwordHash = user.passwordHash;
      walletBalance = newBalance;
      createdAt = user.createdAt;
      updatedAt = now();
    };
    users.add(withdrawal.userId, updatedUser);

    recordTransaction(withdrawal.userId, "credit", Int.fromNat(withdrawal.amount), "Withdrawal rejected - refund");
  };

  // TRANSACTION RECORDING
  func recordTransaction(userId : Principal, txType : Text, amount : Int, description : Text) {
    let tx : Transaction = {
      userId;
      txType;
      amount;
      description;
      timestamp = now();
    };

    let userTxs = switch (transactions.get(userId)) {
      case (null) { [] };
      case (?txs) { txs };
    };

    let updatedTxs = [tx].concat(userTxs);
    transactions.add(userId, updatedTxs);
  };

  public query ({ caller }) func getTransactions(token : Text) : async [Transaction] {
    // Verify caller owns the session
    let session = switch (sessions.get(token)) {
      case (null) { Runtime.trap("Session not found") };
      case (?s) { s };
    };

    if (session.expiry < now()) {
      Runtime.trap("Session expired");
    };

    if (session.userId != caller) {
      Runtime.trap("Unauthorized: Session does not belong to caller");
    };

    switch (transactions.get(caller)) {
      case (null) { [] };
      case (?txs) { txs };
    };
  };

  public query ({ caller }) func getAllTransactions() : async [(Principal, [Transaction])] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all transactions");
    };

    transactions.toArray();
  };
};
