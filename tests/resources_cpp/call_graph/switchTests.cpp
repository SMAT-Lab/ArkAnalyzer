class Animal
{
public:
    virtual void sound() const = 0;
};

class Dog : public Animal
{
public:
    void sound() const override {}
};

class Cat : public Animal
{
public:
    void sound() const override {}
    void sound1() const
    {
        meov();
    }

private:
    void meov() const {}
};

void makeSound(Animal &animal)
{
    animal.sound();
}
int main_switch(int num)
{
    Cat cat;
    switch (num)
    {
    case 1:
        cat.sound();
        break;
    case 2:
        cat.sound1();
        break;

    default:
        makeSound(Dog());
        break;
    }
}