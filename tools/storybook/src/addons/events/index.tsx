import React from 'react';
import { Table, Head, HeadCell, Cell, Body, Row } from '@devtools-ds/table';
import makeClass from 'clsx';
import { useDarkMode } from 'storybook-dark-mode';
import type { API } from '@storybook/api';
import { useEventState } from '../../state/hooks';
import type { EventType } from '../../state';
import styles from './events.css';

interface EventsPanelProps {
  /** if the panel is shown */
  active: boolean;
  /** storybook api */
  api: API;
}

/** Pad the cells to give room */
const ExtraCells = (event: EventType) => {
  if (event.type === 'log') {
    return (
      <>
        <td>{event.severity}</td>
        <td>{event.message.map((a) => JSON.stringify(a)).join(' ')}</td>
      </>
    );
  }

  if (event.type === 'dataChange') {
    return (
      <>
        <td>{event.binding}</td>
        <td>{`${JSON.stringify(event.from)} ➜ ${JSON.stringify(event.to)}`}</td>
      </>
    );
  }

  if (event.type === 'stateChange') {
    let name: string = event.state;

    if (event.state === 'completed') {
      name = `${name} (${event.error ? 'error' : 'success'})`;
    }

    return (
      <>
        <td>{name}</td>
        <td>{event.outcome ?? event.error ?? ''}</td>
      </>
    );
  }

  if (event.type === 'metric') {
    return (
      <>
        <td>{event.metricType}</td>
        <td>{event.message}</td>
      </>
    );
  }

  return null;
};

/** The panel to show events */
export const EventsPanel = (props: EventsPanelProps) => {
  const events = useEventState(props.api.getChannel());
  const darkMode = useDarkMode();

  if (!props.active) {
    return null;
  }

  return (
    <div
      className={makeClass(styles.wrapper, {
        [styles.dark]: darkMode,
      })}
    >
      <Table colorScheme={darkMode ? 'dark' : 'light'}>
        <Head className={styles.header}>
          <Row>
            <HeadCell>Time</HeadCell>
            <HeadCell>Type</HeadCell>
            <HeadCell />
            <HeadCell />
          </Row>
        </Head>
        <Body className={styles.body}>
          {events.map((evt) => (
            <Row key={evt.id}>
              <Cell>{evt.time}</Cell>
              <Cell>{evt.type}</Cell>
              <ExtraCells {...evt} />
            </Row>
          ))}
        </Body>
      </Table>
    </div>
  );
};
