let someArray = [1, "string", false];

for (let entry of someArray) {
    console.log(entry); // 1, "string", false
}

let list = [4, 5, 6];

for (let i in list) {
    console.log(i); // "0", "1", "2",
}

for (let i of list) {
    console.log(i); // "4", "5", "6"
}

list.forEach(i => {
    console.log(i);
});

for (let i = 0; i < list.length; i++) {
    if (i == 0) {
        continue;
    }
    if (i == 2) {
        break;
    }
    console.log(list[i]);
}

let pets = new Set(["Cat", "Dog", "Hamster"]);
for (let pet in pets) {
    console.log(pet); // "species"
}

for (let pet of pets) {
    console.log(pet); // "Cat", "Dog", "Hamster"
}