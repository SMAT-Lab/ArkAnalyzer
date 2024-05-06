class User {
    @Expose({
        since: 3,
    })
    @Type(() => Photo)
    photos: Photo[] = [];
}