import Map "mo:core/Map";
import Principal "mo:core/Principal";

module {
  // Old types for migration
  type OldUser = {
    name : Text;
    phone : Text;
    passwordHash : Blob;
    walletBalance : Nat;
    createdAt : Int;
    updatedAt : Int;
  };

  type OldActor = {
    users : Map.Map<Principal, OldUser>;
    // All other unchanged fields are inferred and mapped automatically.
  };

  // New actor type is inferred from main.mo

  public func run(old : OldActor) : { users : Map.Map<Principal, { name : Text; phone : Text; googleEmail : Text; passwordHash : Blob; walletBalance : Nat; createdAt : Int; updatedAt : Int }> } {
    // Eager conversion to new types.
    let newUsers = old.users.map<Principal, OldUser, { name : Text; phone : Text; googleEmail : Text; passwordHash : Blob; walletBalance : Nat; createdAt : Int; updatedAt : Int }>(
      func(_id, oldUser) {
        { oldUser with googleEmail = "" };
      }
    );
    { users = newUsers };
  };
};
