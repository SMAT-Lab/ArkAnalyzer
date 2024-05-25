@Component
struct SubComponent {
  build() {
    Column() {
      Text('Inner Text')
    }
  }
}

@Component
struct OutComponent {
  build() {
    SubComponent()
      .width(100)
      .height(200)
  }
}