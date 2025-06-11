class Dummy
{
public:
};
void log() {}

class Shape
{
public:
    virtual void draw(Dummy *d) = 0;
};

class Circle : public Shape
{
public:
    Dummy *obj;
    void draw(Dummy *d) override
    {
        log();
        this->obj = d;
    }
};
class Rectangle : public Shape
{
public:
    Dummy *obj;
    void draw(Dummy *d) override
    {
    }
};

Shape *id(Shape *t) { return t; }

int main()
{
    Dummy *d = new Dummy();
    Circle *c = new Circle();
    c->draw(d);
    Shape *b1 = id(c);
    b1->draw(d);
    return 0;
}