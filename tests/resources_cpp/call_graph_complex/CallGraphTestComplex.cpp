class Cat
{
public:
    int runAndSound(int inputItem)
    {
        int info = inputItem + grtNum() * 3;
        return info;
    }

private:
    int grtNum()
    {
        return 2;
    }
};

int main()
{
    Cat cat;
    int result = cat.runAndSound(1);
    return result;
}