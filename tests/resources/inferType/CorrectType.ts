/*
 * Copyright (c) 2024-2026 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

abstract class Animal {
    abstract makeSound(): void;
}

class Cat extends Animal {
    makeSound() {
        console.log('cat sound');
    }
}

class Dog extends Animal {
    makeSound() {
        console.log('dog sound');
    }
}

function test1() {
    let cat: Animal = new Cat();
    cat.makeSound(); // invokeExpr is Animal.makeSound
}

abstract class ManageAnimal {
    protected animal: Animal;
}

class CatManager extends ManageAnimal {
    protected animal: Animal = new Cat();

    animalMakeSound() {
        this.animal.makeSound(); // invokeExpr is Animal.makeSound
    }
}