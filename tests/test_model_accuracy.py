import numpy as np
from app.services.ml_processor import processor

def test_vector_matching_logic():
    """
    CI test: Ensure the math for face matching remains consistent.
    This prevents 'model drift' in our matching algorithm.
    """
    encoding_1 = np.ones(128)
    encoding_2 = np.ones(128) + 0.1 # Very similar
    encoding_3 = np.zeros(128) # Completely different
    
    # 1. Matching similar
    matches = processor.match_batch(encoding_1, [encoding_2])
    assert 0 in matches, "Similar faces should match"
    
    # 2. Rejecting different
    matches = processor.match_batch(encoding_1, [encoding_3])
    assert 0 not in matches, "Different faces should not match"

def test_feature_serialization():
    """
    CI test: Ensure we can serialize/deserialize without precision loss.
    """
    original = np.random.rand(128)
    ser = processor.serialize_encoding(original)
    der = processor.deserialize_encoding(ser)
    
    np.testing.assert_array_almost_equal(original, der, decimal=6)
