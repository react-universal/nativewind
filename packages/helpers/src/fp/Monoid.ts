export interface Magma<A> {
  concat: (x: A, y: A) => A;
}

export interface SemiGroup<A> extends Magma<A> {}

export interface Group<A> extends Monoid<A> {
  inverse: (a: A) => A;
}

export interface Monoid<A> extends SemiGroup<A> {
  empty: A;
}

// const numbersMagma: Magma<number> = {
//   concat(x, y) {
//     return x + y;
//   },
// };

// 1 + 2 === 2 + 1 -> Associative
// 1 - 2 === -2 + 1 -> Commutative
// 2 * 3 === 3 * 2 -> Associative
// 4 / 2 === 2 / 4 -> Commutative

// let alphabets = 'abcdefghijklmnopqrstuvwxyz';
// alphabets += alphabets.toUpperCase();
// alphabets += '0123456789';
// alphabets += '!"·$%&/()=?¿*^¨Ç;:_,.-ºª ';
// const caeserGroup: Group<number> = {
//   concat: (x, y) => (x + y) % alphabets.length,
//   empty: 0,
//   inverse: (a) => (alphabets.length - a) % alphabets.length,
// };

// const encrypt: Encrypt = (plainText, key) =>
//   plainText
//     .split('')
//     .map((x) => {
//       const index = alphabets.indexOf(x);

//       if (index === -1) return x;

//       const newIndex = caeserGroup.concat(index, key);
//       return alphabets[newIndex];
//     })
//     .join('');

// const decrypt: Decrypt = (cipherText, key) =>
//   encrypt(cipherText, caeserGroup.inverse(key));

// const originalText = 'Hello world! 123';
// const encrypted = encrypt(originalText, 7);

// type Encrypt = (plainText: string, key: number) => string;
// type Decrypt = (cipherText: string, key: number) => string;

// console.log(originalText);
// console.log(encrypted);
// console.log(decrypt(encrypted, 7));
