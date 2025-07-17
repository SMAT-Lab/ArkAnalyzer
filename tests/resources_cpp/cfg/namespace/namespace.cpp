namespace nsA {
    void func() {}
}

using namespace nsA;

void test() {
    func();
}