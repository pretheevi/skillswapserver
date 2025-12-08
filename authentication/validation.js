class Validate {
  static login(email, password) {
    if (!email || !password) return false;
    if (!email.includes("@")) return false;
    if (password.length < 4) return false;
    return true;
  }

  static register(name, email, password) {
    if (!name || name.trim().length < 2) return false;
    if (!email || !email.includes("@")) return false;
    if (!password || password.length < 4) return false;
    return true;
  }
}

module.exports = Validate;
