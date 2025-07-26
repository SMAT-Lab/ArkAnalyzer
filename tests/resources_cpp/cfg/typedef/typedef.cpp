#include <map>
#include <string>
#include <vector>

typedef int UserId;
typedef unsigned int uint;
typedef struct {
    int x, y;
} Point;

Point p = {1, 2};


typedef std::map<std::string, std::vector<int>> StrToVecMap;

int main() {
    typedef std::map<std::string, std::vector<int>> StrToVecMap;
    StrToVecMap myMap;
    myMap["key"].push_back(1);
}
