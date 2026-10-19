/* eslint-disable react/sort-comp, react/button-has-type */
import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage } from '@edx/frontend-platform/i18n';
import { connect } from 'react-redux';

import { Alert } from '@openedx/paragon';

import selectors from 'data/selectors';
import messages from './messages';

/**
 * <BulkManagementAlerts />
 * Alerts to display at the top of the BulkManagement tab
 */
export const BulkManagementAlerts = ({
  bulkImportError,
  uploadSuccess,
}) => (
  <>
    <Alert
      variant="danger"
      show={!!bulkImportError}
      dismissible={false}
    >
      {/* Robbo: a translated heading instead of the selector's English "Errors while processing:" */}
      {bulkImportError && <FormattedMessage {...messages.bulkImportError} values={{ errors: bulkImportError }} />}
    </Alert>
    <Alert
      variant="success"
      show={uploadSuccess}
      dismissible={false}
    >
      <FormattedMessage {...messages.successDialog} />
    </Alert>
  </>
);

BulkManagementAlerts.defaultProps = {
  bulkImportError: '',
  uploadSuccess: false,
};

BulkManagementAlerts.propTypes = {
  // redux
  bulkImportError: PropTypes.string,
  uploadSuccess: PropTypes.bool,
};

export const mapStateToProps = (state) => ({
  bulkImportError: selectors.grades.bulkImportError(state),
  uploadSuccess: selectors.grades.uploadSuccess(state),
});

export default connect(mapStateToProps)(BulkManagementAlerts);
