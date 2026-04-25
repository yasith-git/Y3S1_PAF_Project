package com.smartcampus.dto.response;

import lombok.*;
import org.springframework.data.domain.Page;
import java.util.List;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagedResponse<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean last;

    /** Convenience factory from a Spring Data {@link Page}. */
    public static <T> PagedResponse<T> of(Page<T> springPage) {
        return PagedResponse.<T>builder()
            .content(springPage.getContent())
            .page(springPage.getNumber())
            .size(springPage.getSize())
            .totalElements(springPage.getTotalElements())
            .totalPages(springPage.getTotalPages())
            .last(springPage.isLast())
            .build();
    }
}
