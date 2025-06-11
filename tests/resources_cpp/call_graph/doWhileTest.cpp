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