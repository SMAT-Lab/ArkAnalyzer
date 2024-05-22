@Component
export struct BuilderTest {
    build() {
        Column() {
            this.builderTest()
        }
    }

    @Builder
    builderTest() {
        Column() {
            Text('@Builder Test Text')
        }
    }
}