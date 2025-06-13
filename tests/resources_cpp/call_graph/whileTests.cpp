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
int main()
{
    Cat cat;
    makeSound(Dog());
    int num = 1;
    while (num > 0)
    {
        cat.sound();
        num = num - 1;
    }
    return 0;
}
int main_no_brackets()
{
    Cat cat;
    makeSound(Dog());
    int num = 1;
    while (num > 0)
        cat.sound();
    return 0;
}
int main_break()
{
    Cat cat;
    makeSound(Dog());
    int num = 1;
    while (num > 0)
    {
        cat.sound();
        break;
    }
    return 0;
}