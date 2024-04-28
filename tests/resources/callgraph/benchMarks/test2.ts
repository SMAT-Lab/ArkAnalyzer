function animalSound(animal: Animal): Animal {
    animal.sound()
    return animal
}

function main() {
    animalSound(new Dog).sleep()
}





class Animal {
    sound(){
        
    }

    sleep(){}
}

class Dog extends Animal {

}