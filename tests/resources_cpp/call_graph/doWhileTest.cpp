/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
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

class Animal
{
public:
    virtual void sound() const = 0;
};

class Dog : public Animal
{
public:
    void sound() const override{}
};

class Cat : public Animal
{
public:
    void sound() const override{}
    void sound1() const{

    }
};

class Pig : public Animal
{
public:
    void sound() const override{}
};

void makeSound(Animal& animal)
{
    animal.sound();
}
int main(){
    Cat cat;
    makeSound(Dog());
    int num = 1;
    do{
        cat.sound();
        --num;
    }while (num > 0);
    return 0;
}