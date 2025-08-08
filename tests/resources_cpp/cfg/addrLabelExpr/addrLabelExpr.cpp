/*
 * Copyright (c) 2024 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


void foo1(){
    void *ptr = &&my_label;
    my_label : return;
}
void foo2() {
    void *ptr = &&my_label;
    int x = 0;
    if (x == 0){
        goto *ptr;
    } else {
        return ;
    }
my_label2:
     int x = 2;
     goto end;
my_label:
    while (x < 5) {
        char c = 'c';
    }
end:
        int x = 3;
        return 0;
}

int foo3() {
    // 定义两个标签地址指针
    void *ptr1 = &&my_label1;
    void *ptr2 = &&my_label2;

    int choice = 0;

    goto *(choice == 1 ? ptr1 : ptr2);

my_label1:
    int x = 1;
    goto end;

my_label2:
    int x = 2;
    goto end;

end:
    int x = 3;
    return 0;
}