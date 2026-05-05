import { hash, verify } from "@node-rs/argon2";

const argonOptions = {
  memoryCost: 19456,
  timeCost: 3,
  parallelism: 1,
  outputLen: 32
};

export async function hashPassword(password: string) {
  return hash(password, argonOptions);
}

export async function verifyPassword(hashValue: string, password: string) {
  return verify(hashValue, password, argonOptions);
}
