import React, { useRef } from 'react';
import { act, render } from '@testing-library/react';
import { useDropdownInfiniteScroll } from 'src/js/widgets/quickFind/hooks/useDropdownInfiniteScroll';

interface HarnessProps {
  hasMore: boolean;
  loading: boolean;
  loadMore: () => void;
}

const Harness: React.FC<HarnessProps> = ({ hasMore, loading, loadMore }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  useDropdownInfiniteScroll({ containerRef, hasMore, loading, loadMore });
  return (
    <div ref={containerRef} data-testid="container">
      {/* Trigger that points to the portaled listbox via aria-controls */}
      <input aria-controls="menu-id-1" />
    </div>
  );
};

/**
 * Create a portaled listbox in document.body (mirrors how @ids-ts/menu mounts
 * its menu via @ids-ts/portal) and stub its scroll geometry.
 */
const mountListbox = (id: string) => {
  const listbox = document.createElement('div');
  listbox.id = id;
  listbox.setAttribute('role', 'listbox');
  document.body.appendChild(listbox);
  Object.defineProperty(listbox, 'scrollHeight', {
    configurable: true,
    value: 1000,
  });
  Object.defineProperty(listbox, 'clientHeight', {
    configurable: true,
    value: 300,
  });
  Object.defineProperty(listbox, 'scrollTop', {
    configurable: true,
    writable: true,
    value: 0,
  });
  return listbox;
};

const fireScroll = (listbox: HTMLElement, scrollTop: number) => {
  Object.defineProperty(listbox, 'scrollTop', {
    configurable: true,
    writable: true,
    value: scrollTop,
  });
  listbox.dispatchEvent(new Event('scroll'));
};

const flushMutationObservers = async () => {
  // MutationObserver callbacks are microtasks — give them a tick to fire.
  await Promise.resolve();
  await Promise.resolve();
};

describe('useDropdownInfiniteScroll', () => {
  afterEach(() => {
    document.body
      .querySelectorAll('[role="listbox"]')
      .forEach((el) => el.remove());
  });

  it('calls loadMore once the user scrolls past the threshold', async () => {
    const loadMore = jest.fn();
    render(<Harness hasMore loading={false} loadMore={loadMore} />);

    const listbox = mountListbox('menu-id-1');
    await act(async () => {
      await flushMutationObservers();
    });

    // ~25% scrolled → below threshold → loadMore must NOT fire.
    act(() => fireScroll(listbox, 50));
    expect(loadMore).not.toHaveBeenCalled();

    // ~90% scrolled → above 0.8 default threshold → loadMore fires.
    act(() => fireScroll(listbox, 620));
    expect(loadMore).toHaveBeenCalledTimes(1);
  });

  it('does not call loadMore when hasMore is false', async () => {
    const loadMore = jest.fn();
    render(<Harness hasMore={false} loading={false} loadMore={loadMore} />);
    const listbox = mountListbox('menu-id-1');
    await act(async () => {
      await flushMutationObservers();
    });

    act(() => fireScroll(listbox, 900));
    expect(loadMore).not.toHaveBeenCalled();
  });

  it('does not call loadMore while a previous request is loading', async () => {
    const loadMore = jest.fn();
    render(<Harness hasMore loading loadMore={loadMore} />);
    const listbox = mountListbox('menu-id-1');
    await act(async () => {
      await flushMutationObservers();
    });

    act(() => fireScroll(listbox, 900));
    expect(loadMore).not.toHaveBeenCalled();
  });

  it('reads the latest loadMore/hasMore/loading via the state ref', async () => {
    const loadMoreA = jest.fn();
    const loadMoreB = jest.fn();
    const { rerender } = render(
      <Harness hasMore loading={false} loadMore={loadMoreA} />,
    );
    const listbox = mountListbox('menu-id-1');
    await act(async () => {
      await flushMutationObservers();
    });

    // Swap callbacks WITHOUT remounting — the listener must continue to work
    // and pick up the new loadMore from the state ref.
    rerender(<Harness hasMore loading={false} loadMore={loadMoreB} />);

    act(() => fireScroll(listbox, 900));
    expect(loadMoreA).not.toHaveBeenCalled();
    expect(loadMoreB).toHaveBeenCalledTimes(1);
  });
});
