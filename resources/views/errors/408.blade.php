@php
    $page = 'error';
    $status = 408;
@endphp

@extends('layouts.app')

@section('content')
    <x-error-page :status="408" />
@endsection
