namespace mainSpace
{
    int x = 0;
    int y = 1;

    class innerClass
    {
        int getValue()
        {
            return mainSpace::x;

        }
    };
}