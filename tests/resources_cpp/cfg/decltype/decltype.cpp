#include <vector>
#include <string>

void autoTest() {
   auto a = 5;

   std::vector<int> vec = {1, 2, 3};
   auto it = vec.begin();
   auto it2 = vec[0];

   auto lambda = [](int x) { return x * 2; };
}

void decltypeTest() {
   int a = 10;
   decltype(a) w = 10;

   auto b = 5;
   decltype(b) y = b;

   int c = 10;
   decltype(auto) y = c;  // y 是 int&
   decltype(auto) z = 42; // z 是 int
}