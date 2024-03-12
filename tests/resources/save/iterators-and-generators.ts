let someArray = [1, "string", false];

for (let entry of someArray) {
    logger.info(entry); // 1, "string", false
}

let list = [4, 5, 6];

for (let i in list) {
    logger.info(i); // "0", "1", "2",
}

for (let i of list) {
    logger.info(i); // "4", "5", "6"
}

list.forEach(i => {
    logger.info(i);
});

for (let i = 0; i < list.length; i++) {
    if (i == 0) {
        continue;
    }
    if (i == 2) {
        break;
    }
    logger.info(list[i]);
}

let pets = new Set(["Cat", "Dog", "Hamster"]);
for (let pet in pets) {
    logger.info(pet); // "species"
}

for (let pet of pets) {
    logger.info(pet); // "Cat", "Dog", "Hamster"
}