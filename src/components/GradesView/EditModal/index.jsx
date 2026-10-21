// Modifications Copyright (C) 2026 Robbo. See NOTICE at repository root.
import React from 'react';

import {
  Button,
  Alert,
  ModalDialog,
  ActionRow,
  Tab,
  Tabs,
} from '@openedx/paragon';
import { useIntl } from '@edx/frontend-platform/i18n';

import LearnerAnswers from 'robbo/answers/LearnerAnswers';
import robboMessages from 'robbo/answers/messages';

import OverrideTable from './OverrideTable';
import ModalHeaders from './ModalHeaders';
import useEditModalData, { modalTabs } from './hooks';
import messages from './messages';

/**
 * <EditModal />
 * Wrapper component for the modal that allows editing the grade for an individual
 * unit, for a given student.
 * Provides a StatusAlert with override fetch errors if any are found, an OverrideTable
 * (with appropriate headers) for managing the actual override, and a submit button for
 * adjusting the grade.
 * (also provides a close button that clears the modal state)
 *
 * Robbo: the learner's answers to the problems of the unit come first, on their own tab; with
 * frozen grades they are all the modal shows.
 */
export const EditModal = () => {
  const { formatMessage } = useIntl();
  const {
    onClose,
    error,
    handleAdjustedGradeClick,
    isOpen,
    areGradesFrozen,
    activeTab,
    setActiveTab,
  } = useEditModalData();
  const isOverrideTab = !areGradesFrozen && activeTab === modalTabs.override;
  const title = formatMessage(areGradesFrozen ? robboMessages.answersTitle : robboMessages.modalTitle);

  return (
    <ModalDialog
      className="robbo-grade-modal"
      title={title}
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      hasCloseButton
      isFullscreenOnMobile
    >
      {/* Robbo: a header keeps the close button out of the scrolled list of answers. */}
      <ModalDialog.Header>
        <ModalDialog.Title>{title}</ModalDialog.Title>
      </ModalDialog.Header>
      <ModalDialog.Body>
        <div>
          <ModalHeaders />
          {areGradesFrozen ? (
            <div className="robbo-grade-modal__answers-only"><LearnerAnswers /></div>
          ) : (
            <Tabs
              id="robbo-grade-modal-tabs"
              className="robbo-grade-modal__tabs"
              activeKey={activeTab}
              onSelect={setActiveTab}
            >
              <Tab eventKey={modalTabs.answers} title={formatMessage(robboMessages.answersTab)}>
                <LearnerAnswers />
              </Tab>
              <Tab eventKey={modalTabs.override} title={formatMessage(robboMessages.overrideTab)}>
                <Alert variant="danger" show={!!error} dismissible={false}>
                  {error}
                </Alert>
                <OverrideTable />
                <div>{formatMessage(messages.visibility)}</div>
                <div>{formatMessage(messages.saveVisibility)}</div>
              </Tab>
            </Tabs>
          )}
        </div>
      </ModalDialog.Body>

      <ModalDialog.Footer>
        <ActionRow>
          <ModalDialog.CloseButton variant="tertiary">
            {formatMessage(isOverrideTab ? messages.closeText : robboMessages.close)}
          </ModalDialog.CloseButton>
          {isOverrideTab && (
            <Button variant="primary" onClick={handleAdjustedGradeClick}>
              {formatMessage(messages.saveGrade)}
            </Button>
          )}
        </ActionRow>
      </ModalDialog.Footer>
    </ModalDialog>
  );
};

export default EditModal;
