#include <map>
#include <string>
#include <vector>

typedef int UserId;
typedef unsigned int uint;

typedef struct {
    int x, y;
} Point;

typedef union {
    int x;
    float y;
} Value;

typedef enum {
    RED;
    GREEN;
    BLUE;
} Color;


int main() {
    typedef std::map<std::string, std::vector<int>> StrToVecMap;
    StrToVecMap myMap;
    myMap["key"].push_back(1);
}
