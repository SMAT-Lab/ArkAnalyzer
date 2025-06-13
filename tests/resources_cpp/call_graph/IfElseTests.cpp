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
    if (num > 0){
        cat.sound();
    }
    else{
        cat.sound1();
    }
    return 0;
}
int main_if_elseif_else(){
    Cat cat;
    int num = 1;
    if (num == 0){
        cat.sound();
    } else if (num == 1){
        cat.sound1();
    } else {
        makeSound(Dog());
    }
    return 0;
}